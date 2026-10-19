import { getDb, saveDb } from '../../src/server/db';
import { Booking, Hotel, Room, EmailNotification } from '../../src/server/types';

/**
 * Generate a luxury, responsive HTML email template for ASVILLA booking confirmations
 */
export function generateBookingConfirmationHtml(
  booking: Booking,
  hotel: Hotel,
  room?: Room
): { html: string; text: string; subject: string } {
  const isCod = booking.paymentMethod === 'COD' || booking.paymentStatus === 'unpaid';
  const owner = hotel.owner || {
    name: 'Executive Concierge Desk',
    role: 'General Manager',
    phone: '+91 1800 278 4552',
    email: 'reservations@asvilla.com',
    deskPhone: '+91 1800 278 4552',
    verified: true,
    checkInInstructions: 'Please present your booking reference voucher during check-in with a valid government ID.',
  };

  const subject = `[ASVILLA] Booking Confirmation — ${booking.bookingReference} at ${hotel.name}`;

  const text = `
ASVILLA — LUXURY HOTEL & RESERVATION CONFIRMATION
Reference: ${booking.bookingReference}

Dear ${booking.guestName},

Thank you for choosing ASVILLA. Your stay at ${hotel.name} has been successfully registered.

RESERVATION DETAILS:
- Hotel: ${hotel.name}
- Address: ${hotel.address}, ${hotel.city}, ${hotel.country}
- Room: ${room ? room.roomType : booking.roomType || 'Luxury Suite'}
- Check-in: ${booking.checkIn} (From ${hotel.checkInTime || '14:00 hrs'})
- Check-out: ${booking.checkOut} (Until ${hotel.checkOutTime || '12:00 hrs'})
- Nights: ${booking.priceBreakdown.nights} | Rooms: ${booking.numberOfRooms} | Guests: ${booking.numberOfGuests}
- Payment Method: ${isCod ? 'Pay at Hotel (Cash on Delivery / COD)' : 'Paid Online (Razorpay Verified)'}
- Total Amount: INR ${booking.priceBreakdown.totalAmount.toLocaleString('en-IN')}

PROPERTY HOST & ARRIVAL CONTACT:
- Host / Manager: ${owner.name} (${owner.role})
- Direct Host Mobile: ${owner.phone}
- Direct Reception Desk: ${owner.deskPhone || owner.phone}
- Official Host Email: ${owner.email}
- Check-in Instructions: ${owner.checkInInstructions || 'Welcome upon arrival at main reception desk.'}

CANCELLATION POLICY:
${hotel.cancellationPolicy || 'Free cancellation up to 48 hours before check-in.'}

24/7 ASVILLA Concierge Desk: reservations@asvilla.com | +91 1800 278 4552
Your Stay, Your Comfort, Your Way.
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1ede6; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2dcd2; }
    .header { background: #0B132B; padding: 32px 28px; text-align: center; border-bottom: 4px solid #D4AF37; }
    .brand { font-family: Georgia, serif; font-size: 26px; font-weight: bold; letter-spacing: 0.25em; color: #ffffff; margin: 0; }
    .tagline { color: #D4AF37; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 6px; }
    .banner { padding: 18px 28px; background: ${isCod ? '#fef3c7' : '#ecfdf5'}; border-bottom: 1px solid ${isCod ? '#fde68a' : '#d1fae5'}; }
    .banner-title { font-weight: bold; font-size: 15px; color: ${isCod ? '#92400e' : '#065f46'}; margin: 0 0 4px 0; }
    .banner-sub { font-size: 12px; color: ${isCod ? '#b45309' : '#047857'}; margin: 0; }
    .body-content { padding: 28px; }
    .ref-badge { display: inline-block; background: #0B132B; color: #D4AF37; font-family: monospace; font-size: 14px; font-weight: bold; padding: 6px 14px; border-radius: 6px; letter-spacing: 1px; }
    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #8C6D23; margin: 24px 0 12px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .card { background: #faf8f5; border: 1px solid #e8e2d8; border-radius: 12px; padding: 18px; margin-bottom: 18px; }
    .grid { display: table; width: 100%; margin-top: 10px; }
    .grid-row { display: table-row; }
    .grid-cell { display: table-cell; padding: 6px 0; font-size: 13px; vertical-align: top; }
    .label { color: #64748b; width: 40%; font-weight: 500; }
    .value { color: #0f172a; font-weight: 600; text-align: right; }
    .host-box { background: #fdfbf7; border: 1px solid #d4af3740; border-left: 4px solid #D4AF37; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .host-name { font-weight: bold; font-size: 14px; color: #0B132B; }
    .host-role { font-size: 12px; color: #8C6D23; margin-bottom: 8px; }
    .host-contact { font-size: 12px; color: #334155; line-height: 1.6; }
    .host-contact a { color: #0B132B; font-weight: 600; text-decoration: none; }
    .total-row { font-size: 16px; font-weight: bold; color: #047857; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 8px; }
    .footer { background: #070B19; color: #94a3b8; padding: 24px 28px; text-align: center; font-size: 11px; line-height: 1.6; }
    .footer a { color: #D4AF37; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="brand">ASVILLA</div>
      <div class="tagline">Your Stay &middot; Your Comfort &middot; Your Way</div>
    </div>

    <!-- Banner -->
    <div class="banner">
      <div class="banner-title">${isCod ? '✓ Reservation Placed · Pay at Hotel (COD)' : '✓ Booking Confirmed & Guaranteed'}</div>
      <div class="banner-sub">
        ${isCod
          ? `Settlement due at check-in: INR ${booking.priceBreakdown.totalAmount.toLocaleString('en-IN')}. Cash, UPI, or Cards accepted at the front desk.`
          : 'Payment captured securely via Razorpay Payment Gateway.'}
      </div>
    </div>

    <!-- Content -->
    <div class="body-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; display: block;">Booking Reference</span>
          <span class="ref-badge">${booking.bookingReference}</span>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; display: block;">Date Issued</span>
          <span style="font-size: 12px; font-weight: 600; color: #334155;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Dear <strong>${booking.guestName}</strong>,<br>
        Thank you for choosing ASVILLA for your upcoming stay. Your room reservation at <strong>${hotel.name}</strong> is safely booked.
      </p>

      <!-- Hotel & Stay Card -->
      <div class="card">
        <div style="font-size: 11px; font-weight: bold; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.1em;">Sanctuary & Destination</div>
        <div style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; color: #0B132B; margin-top: 4px;">${hotel.name}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">📍 ${hotel.address}, ${hotel.city}, ${hotel.state}, India - ${hotel.pincode}</div>
        
        <div class="grid" style="margin-top: 14px; border-top: 1px solid #e8e2d8; padding-top: 10px;">
          <div class="grid-row">
            <div class="grid-cell label">Suite Category:</div>
            <div class="grid-cell value">${room ? room.roomType : booking.roomType || 'Luxury Deluxe Suite'} (${room?.bedType || 'King Bed'})</div>
          </div>
          <div class="grid-row">
            <div class="grid-cell label">Check-in Date:</div>
            <div class="grid-cell value">${booking.checkIn} (from ${hotel.checkInTime || '14:00 hrs'})</div>
          </div>
          <div class="grid-row">
            <div class="grid-cell label">Check-out Date:</div>
            <div class="grid-cell value">${booking.checkOut} (until ${hotel.checkOutTime || '12:00 hrs'})</div>
          </div>
          <div class="grid-row">
            <div class="grid-cell label">Duration & Occupancy:</div>
            <div class="grid-cell value">${booking.priceBreakdown.nights} Nights &middot; ${booking.numberOfRooms} Room(s) &middot; ${booking.numberOfGuests} Guests</div>
          </div>
          ${booking.specialRequests ? `
          <div class="grid-row">
            <div class="grid-cell label">Special Requests:</div>
            <div class="grid-cell value" style="font-style: italic;">${booking.specialRequests}</div>
          </div>` : ''}
        </div>
      </div>

      <!-- Hotel Owner / Property Host Section -->
      <div class="section-title">Property Host & Arrival Assistance</div>
      <div class="host-box">
        <div class="host-name">👤 ${owner.name} <span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">✓ Verified Host</span></div>
        <div class="host-role">${owner.role} &middot; Experience: ${owner.experienceYears || 15}+ Years</div>
        <div class="host-contact">
          <div>📞 <strong>Direct Host Mobile:</strong> <a href="tel:${owner.phone}">${owner.phone}</a></div>
          <div>☎️ <strong>Front Reception Desk:</strong> <a href="tel:${owner.deskPhone || owner.phone}">${owner.deskPhone || owner.phone}</a></div>
          <div>✉️ <strong>Official Property Email:</strong> <a href="mailto:${owner.email}">${owner.email}</a></div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #d4af3740;">
            🛎️ <strong>Arrival Instructions:</strong><br>
            <span style="color: #475569; font-size: 12px;">${owner.checkInInstructions || 'Our concierge team will meet you at the reception portico upon arrival.'}</span>
          </div>
        </div>
      </div>

      <!-- Itemized Price Breakdown -->
      <div class="section-title">Itemized Price Breakdown</div>
      <div class="card">
        <div class="grid">
          <div class="grid-row">
            <div class="grid-cell label">Room Charges (${booking.priceBreakdown.nights}N &times; ${booking.numberOfRooms}R):</div>
            <div class="grid-cell value">₹${booking.priceBreakdown.roomTotal.toLocaleString('en-IN')}</div>
          </div>
          <div class="grid-row">
            <div class="grid-cell label">Goods & Services Tax (12% GST):</div>
            <div class="grid-cell value">₹${booking.priceBreakdown.gstAmount.toLocaleString('en-IN')}</div>
          </div>
          <div class="grid-row">
            <div class="grid-cell label">Concierge & Heritage Service Fee:</div>
            <div class="grid-cell value">₹${booking.priceBreakdown.serviceFee.toLocaleString('en-IN')}</div>
          </div>
          ${booking.priceBreakdown.discountAmount > 0 ? `
          <div class="grid-row">
            <div class="grid-cell label" style="color: #047857;">Promo Discount (${booking.priceBreakdown.promoCode || 'PROMO'}):</div>
            <div class="grid-cell value" style="color: #047857;">-₹${booking.priceBreakdown.discountAmount.toLocaleString('en-IN')}</div>
          </div>` : ''}
          <div class="grid-row">
            <div class="grid-cell label total-row">${isCod ? 'Total Payable at Check-in:' : 'Total Amount Paid:'}</div>
            <div class="grid-cell value total-row">INR ₹${booking.priceBreakdown.totalAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <!-- Cancellation Policy -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #475569;">
        <strong>Cancellation Policy:</strong> ${hotel.cancellationPolicy || 'Free cancellation up to 48 hours prior to check-in.'}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div style="font-weight: bold; color: #ffffff; margin-bottom: 4px;">ASVILLA Luxury Concierge Reservations</div>
      <div>Direct Line: +91 1800 278 4552 &middot; Email: <a href="mailto:reservations@asvilla.com">reservations@asvilla.com</a></div>
      <div style="margin-top: 8px; color: #64748b;">This email confirmation serves as your digital stay voucher. Please carry a copy on your mobile device.</div>
    </div>
  </div>
</body>
</html>
`.trim();

  return { html, text, subject };
}

/**
 * Generate luxury HTML email for booking cancellation
 */
export function generateCancellationHtml(
  booking: Booking,
  hotel: Hotel,
  refundAmount?: number
): { html: string; text: string; subject: string } {
  const subject = `[ASVILLA] Cancellation Notice — ${booking.bookingReference} at ${hotel.name}`;
  const text = `
ASVILLA RESERVATION CANCELLATION NOTICE
Booking Reference: ${booking.bookingReference}

Dear ${booking.guestName},

As requested, your reservation at ${hotel.name} for the dates ${booking.checkIn} to ${booking.checkOut} has been cancelled.

${refundAmount ? `A refund of INR ${refundAmount.toLocaleString('en-IN')} has been initiated according to the hotel cancellation policy.` : 'No cancellation fee applies.'}

For any queries, contact our 24/7 Concierge at reservations@asvilla.com or +91 1800 278 4552.
ASVILLA Team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background: #0B132B; padding: 24px; text-align: center; border-bottom: 3px solid #ef4444; }
    .content { padding: 24px; }
    .badge { background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="color: #ffffff; margin: 0; letter-spacing: 2px;">ASVILLA</h2>
      <p style="color: #cbd5e1; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase;">Reservation Cancellation Notice</p>
    </div>
    <div class="content">
      <span class="badge">Booking Cancelled</span>
      <h3 style="color: #0f172a; margin-top: 14px;">Reservation: ${booking.bookingReference}</h3>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Dear <strong>${booking.guestName}</strong>,<br>
        Your reservation at <strong>${hotel.name}</strong> (${booking.checkIn} to ${booking.checkOut}) has been cancelled as per your request.
      </p>
      ${refundAmount ? `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 8px; font-size: 13px; color: #166534; margin: 16px 0;">
        ✓ <strong>Refund Initiated:</strong> INR ${refundAmount.toLocaleString('en-IN')} will be credited back to your original source of payment within 3-5 business days.
      </div>` : ''}
      <p style="font-size: 13px; color: #64748b;">
        Reason on file: <em>${booking.cancellationReason || 'Guest requested cancellation'}</em>
      </p>
      <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
        Need further assistance? Contact Concierge at reservations@asvilla.com or 1800 278 4552.
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

  return { html, text, subject };
}

/**
 * Dispatch booking confirmation email notification (Guest + Hotel Host)
 */
export async function sendBookingConfirmationNotification(
  booking: Booking,
  hotel: Hotel,
  room?: Room
): Promise<{ success: boolean; emailCount: number; notifications: EmailNotification[] }> {
  try {
    const db = await getDb();
    if (!db.notifications) {
      db.notifications = [];
    }

    const { html, text, subject } = generateBookingConfirmationHtml(booking, hotel, room);
    const now = new Date().toISOString();

    const createdNotifications: EmailNotification[] = [];

    // 1. Notification to Guest
    const guestNotification: EmailNotification = {
      _id: 'notif_guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      recipientEmail: booking.guestEmail,
      recipientName: booking.guestName,
      recipientRole: 'guest',
      subject,
      htmlBody: html,
      textBody: text,
      status: 'delivered',
      type: 'booking_confirmation',
      sentAt: now,
    };
    db.notifications.unshift(guestNotification);
    createdNotifications.push(guestNotification);

    // 2. Notification to Hotel Owner / Manager
    const hostEmail = hotel.owner?.email || 'manager.' + hotel.slug + '@asvilla.com';
    const hostNotification: EmailNotification = {
      _id: 'notif_host_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      recipientEmail: hostEmail,
      recipientName: hotel.owner?.name || `${hotel.name} Concierge`,
      recipientRole: 'hotel_owner',
      subject: `[ASVILLA NEW GUEST RESERVATION] ${booking.bookingReference} — ${booking.guestName} (${booking.numberOfRooms} Room)`,
      htmlBody: html,
      textBody: text,
      status: 'delivered',
      type: 'booking_confirmation',
      sentAt: now,
    };
    db.notifications.unshift(hostNotification);
    createdNotifications.push(hostNotification);

    saveDb(db);

    console.log(`📧 [EMAIL DELIVERED] Confirmation email sent to ${booking.guestEmail} and host ${hostEmail} for Ref: ${booking.bookingReference}`);

    return {
      success: true,
      emailCount: createdNotifications.length,
      notifications: createdNotifications,
    };
  } catch (err) {
    console.error('Error dispatching booking confirmation email:', err);
    return { success: false, emailCount: 0, notifications: [] };
  }
}

/**
 * Dispatch booking cancellation notification
 */
export async function sendBookingCancellationNotification(
  booking: Booking,
  hotel: Hotel,
  refundAmount?: number
): Promise<{ success: boolean }> {
  try {
    const db = await getDb();
    if (!db.notifications) {
      db.notifications = [];
    }

    const { html, text, subject } = generateCancellationHtml(booking, hotel, refundAmount);
    const now = new Date().toISOString();

    const cancellationNotification: EmailNotification = {
      _id: 'notif_cancel_' + Date.now().toString(36),
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      recipientEmail: booking.guestEmail,
      recipientName: booking.guestName,
      recipientRole: 'guest',
      subject,
      htmlBody: html,
      textBody: text,
      status: 'delivered',
      type: 'cancellation_notice',
      sentAt: now,
    };

    db.notifications.unshift(cancellationNotification);
    saveDb(db);

    console.log(`📧 [EMAIL DELIVERED] Cancellation email dispatched to ${booking.guestEmail} for Ref: ${booking.bookingReference}`);
    return { success: true };
  } catch (err) {
    console.error('Error sending cancellation email:', err);
    return { success: false };
  }
}

/**
 * Resend booking confirmation email on demand
 */
export async function resendBookingEmail(
  bookingIdOrRef: string
): Promise<{ success: boolean; message: string; notification?: EmailNotification }> {
  const db = await getDb();
  const booking = db.bookings.find(b => b._id === bookingIdOrRef || b.bookingReference === bookingIdOrRef);

  if (!booking) {
    return { success: false, message: 'Booking not found.' };
  }

  const hotel = db.hotels.find(h => h._id === booking.hotelId);
  if (!hotel) {
    return { success: false, message: 'Hotel not found for booking.' };
  }

  const room = db.rooms.find(r => r._id === booking.roomId);

  const result = await sendBookingConfirmationNotification(booking, hotel, room);
  if (result.success && result.notifications.length > 0) {
    return {
      success: true,
      message: `Confirmation email has been resent to ${booking.guestEmail}.`,
      notification: result.notifications[0],
    };
  }

  return { success: false, message: 'Failed to resend confirmation email.' };
}

/**
 * Get email preview HTML & data for a booking
 */
export async function getBookingEmailPreview(
  bookingIdOrRef: string
): Promise<{ success: boolean; html?: string; text?: string; subject?: string; recipient?: string }> {
  const db = await getDb();
  const booking = db.bookings.find(b => b._id === bookingIdOrRef || b.bookingReference === bookingIdOrRef);

  if (!booking) {
    return { success: false };
  }

  const hotel = db.hotels.find(h => h._id === booking.hotelId);
  if (!hotel) {
    return { success: false };
  }

  const room = db.rooms.find(r => r._id === booking.roomId);
  const { html, text, subject } = generateBookingConfirmationHtml(booking, hotel, room);

  return {
    success: true,
    html,
    text,
    subject,
    recipient: booking.guestEmail,
  };
}
