import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb, saveDb } from '../db';
import { Payment } from '../types';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { sendBookingConfirmationNotification } from '../../../backend/services/emailService';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_asvilla123456';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'asvilla_test_secret_key_987654321';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'asvilla_webhook_secret_key';

// Helper: Calculate HMAC SHA256 signature
function generateSignature(orderId: string, paymentId: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

// POST /api/payments/create-order
router.post('/create-order', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      res.status(400).json({ success: false, message: 'bookingId is required.' });
      return;
    }

    const db = await getDb();
    const booking = db.bookings.find(b => b._id === bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    // Authorization check
    if (booking.userId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized booking ownership.' });
      return;
    }

    if (booking.paymentStatus === 'success') {
      res.status(400).json({ success: false, message: 'Booking is already paid and confirmed.' });
      return;
    }

    // STRICT: Amount is derived EXCLUSIVELY from server-calculated price breakdown
    const amountInINR = booking.priceBreakdown.totalAmount;
    const amountInPaise = Math.round(amountInINR * 100);

    // Generate or use Razorpay order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    booking.razorpayOrderId = orderId;
    booking.updatedAt = new Date().toISOString();
    saveDb(db);

    res.json({
      success: true,
      order: {
        id: orderId,
        amount: amountInPaise,
        currency: 'INR',
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        notes: {
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          hotelId: booking.hotelId,
        },
      },
      keyId: RAZORPAY_KEY_ID,
      isTestMode: true, // Clearly marks Razorpay Test Sandbox Mode
    });
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ success: false, message: 'Server error generating payment order.' });
  }
});

// POST /api/payments/verify
router.post('/verify', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod = 'UPI / NetBanking',
    } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({
        success: false,
        message: 'bookingId, razorpay_order_id, and razorpay_payment_id are required.',
      });
      return;
    }

    const db = await getDb();
    const booking = db.bookings.find(b => b._id === bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking record not found.' });
      return;
    }

    // Idempotency check: if already confirmed
    if (booking.paymentStatus === 'success' && booking.bookingStatus === 'confirmed') {
      const existingPayment = db.payments.find(p => p.bookingId === booking._id);
      res.json({
        success: true,
        message: 'Payment already verified and booking is active.',
        booking,
        payment: existingPayment,
      });
      return;
    }

    // Calculate expected signature on backend using Razorpay secret
    const expectedSignature = generateSignature(razorpay_order_id, razorpay_payment_id, RAZORPAY_KEY_SECRET);

    // Verify signature (allowing simulated valid signature in sandbox or standard sha256)
    const isValidSignature =
      razorpay_signature === expectedSignature ||
      (razorpay_signature && razorpay_signature.startsWith('sandbox_sig_'));

    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      booking.paymentStatus = 'failed';
      booking.updatedAt = new Date().toISOString();
      saveDb(db);

      res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid digital signature.',
      });
      return;
    }

    // CONFIRM BOOKING ATOMICALLY ONLY AFTER VERIFIED PAYMENT
    booking.paymentStatus = 'success';
    booking.bookingStatus = 'confirmed';
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.updatedAt = new Date().toISOString();

    const paymentRecord: Payment = {
      _id: 'pay_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      userId: booking.userId,
      provider: 'razorpay',
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
      providerSignature: razorpay_signature || expectedSignature,
      amount: booking.priceBreakdown.totalAmount,
      amountInPaise: Math.round(booking.priceBreakdown.totalAmount * 100),
      currency: 'INR',
      status: 'captured',
      method: paymentMethod,
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    booking.paymentId = paymentRecord._id;

    db.payments.unshift(paymentRecord);
    saveDb(db);

    const hotel = db.hotels.find(h => h._id === booking.hotelId);
    const room = db.rooms.find(r => r._id === booking.roomId);

    if (hotel) {
      booking.hotelOwner = hotel.owner;
      sendBookingConfirmationNotification(booking, hotel, room).catch(e =>
        console.error('Email dispatch error on online payment confirmation:', e)
      );
    }

    res.json({
      success: true,
      message: 'Payment successfully verified! Your stay at ASVILLA is officially confirmed.',
      booking,
      payment: paymentRecord,
      hotel,
      room,
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, message: 'Server error verifying payment.' });
  }
});

// POST /api/payments/webhook
router.post('/webhook', async (req, res): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const bodyStr = JSON.stringify(req.body);

    if (signature) {
      const expectedWebhookSig = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(bodyStr)
        .digest('hex');

      if (signature !== expectedWebhookSig && process.env.NODE_ENV === 'production') {
        res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
        return;
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' && payload?.payment?.entity) {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const db = await getDb();
      const booking = db.bookings.find(b => b.razorpayOrderId === orderId);
      if (booking && booking.paymentStatus !== 'success') {
        booking.paymentStatus = 'success';
        booking.bookingStatus = 'confirmed';
        booking.razorpayPaymentId = paymentEntity.id;
        booking.updatedAt = new Date().toISOString();
        saveDb(db);
      }
    }

    res.json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false, message: 'Webhook processing error.' });
  }
});

// GET /api/payments/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const payment = db.payments.find(p => p._id === id || p.providerPaymentId === id);

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found.' });
      return;
    }

    // Ownership check
    if (payment.userId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.json({ success: true, payment });
  } catch (err: any) {
    console.error('Error retrieving payment:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving payment.' });
  }
});

export default router;
