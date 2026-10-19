import { Response } from 'express';
import { getDb, saveDb } from '../../src/server/db';
import { Booking, PriceBreakdown } from '../../src/server/types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { BookingModel } from '../models/Booking';
import { HotelModel, RoomModel } from '../models/Hotel';
import { isAtlasActive, getDatabaseStatus } from '../config/db';
import { checkRoomAvailabilityDb } from './hotelController';
import {
  sendBookingConfirmationNotification,
  sendBookingCancellationNotification,
  resendBookingEmail as resendEmailService,
  getBookingEmailPreview as getEmailPreviewService,
} from '../services/emailService';

// POST /api/bookings
export async function createBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      hotelId,
      roomId,
      checkIn,
      checkOut,
      numberOfGuests = 2,
      numberOfRooms = 1,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      promoCode,
      paymentMethod = 'COD', // Default or chosen: 'COD' | 'ONLINE'
    } = req.body;

    const validationErrors: string[] = [];

    if (!hotelId) validationErrors.push('Hotel identifier (hotelId) is required.');
    if (!checkIn) validationErrors.push('Check-in date is required.');
    if (!checkOut) validationErrors.push('Check-out date is required.');
    if (!guestName || guestName.trim() === '') validationErrors.push('Guest full name is required.');
    if (!guestEmail || guestEmail.trim() === '') validationErrors.push('Guest email address is required.');

    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        message: validationErrors.join(' '),
        errors: validationErrors,
      });
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        message: 'Invalid dates. Check-out date must be strictly after check-in date.',
        errors: ['Invalid dates: Check-out must be after check-in.'],
      });
      return;
    }

    const diffDays = Math.max(
      1,
      Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const db = await getDb();
    let hotel = db.hotels.find(h => h._id === hotelId);

    // If not found in local db, check Atlas
    if (!hotel && isAtlasActive()) {
      hotel = (await HotelModel.findOne({ _id: hotelId }).lean()) as any;
    }

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: 'The requested hotel property was not found.',
      });
      return;
    }

    // Resolve room: if roomId is missing or invalid, resolve to hotel's primary room
    let room = db.rooms.find(r => r._id === roomId && r.hotelId === hotelId);
    if (!room) {
      room = db.rooms.find(r => r.hotelId === hotelId);
    }
    if (!room && isAtlasActive()) {
      room = (await RoomModel.findOne({ hotelId }).lean()) as any;
    }

    if (!room) {
      res.status(404).json({
        success: false,
        message: 'No available room categories found for this hotel.',
      });
      return;
    }

    const numRooms = Math.max(1, parseInt(String(numberOfRooms), 10) || 1);
    const numGuests = Math.max(1, parseInt(String(numberOfGuests), 10) || 2);

    // Check room availability for dates (verifies MongoDB Atlas overlapping bookings)
    const availability = await checkRoomAvailabilityDb(room._id, checkIn, checkOut, numRooms);
    if (!availability.available) {
      res.status(409).json({
        success: false,
        message: `Only ${availability.remainingRooms} room(s) available for the selected dates. Please adjust dates or reduce room count.`,
        remainingRooms: availability.remainingRooms,
      });
      return;
    }

    // Server-Authoritative Price Calculation
    const basePrice = room.pricePerNight;
    const roomTotal = basePrice * diffDays * numRooms;

    let discountAmount = 0;
    let appliedPromo: string | undefined = undefined;

    if (promoCode && typeof promoCode === 'string') {
      const code = promoCode.toUpperCase().trim();
      const validPromo: any = db.offers.find(
        (o: any) => o.code === code && (o.isActive || o.active) && new Date(o.validUntil) >= new Date()
      );
      if (validPromo) {
        appliedPromo = validPromo.code;
        const percent = validPromo.discountPercent || (validPromo.discountType === 'percentage' ? validPromo.discountValue : 0);
        if (percent > 0) {
          discountAmount = Math.round((roomTotal * percent) / 100);
        } else if (validPromo.discountValue) {
          discountAmount = validPromo.discountValue;
        }
        if (validPromo.maxDiscount) {
          discountAmount = Math.min(discountAmount, validPromo.maxDiscount);
        }
      }
    }

    const discountedSubtotal = Math.max(0, roomTotal - discountAmount);
    // 18% GST (Standard luxury hospitality tax in India)
    const gstAmount = Math.round(discountedSubtotal * 0.18);
    // Luxury concierge service fee
    const serviceFee = 499;
    const totalAmount = discountedSubtotal + gstAmount + serviceFee;

    const priceBreakdown: PriceBreakdown = {
      basePrice,
      nights: diffDays,
      rooms: numRooms,
      roomTotal,
      gstAmount,
      serviceFee,
      discountAmount,
      promoCode: appliedPromo,
      totalAmount,
    };

    const isCod = paymentMethod === 'COD' || paymentMethod === 'PAY_AT_HOTEL';
    const chosenMethod = isCod ? 'COD' : 'ONLINE';

    // Status assignment based on payment method
    // COD: bookingStatus = 'pending_confirmation', paymentStatus = 'unpaid'
    // ONLINE: bookingStatus = 'pending', paymentStatus = 'pending'
    const bookingStatus = isCod ? 'pending_confirmation' : 'pending';
    const paymentStatus = isCod ? 'unpaid' : 'pending';

    // Generate unique booking reference
    const bookingRef = `ASV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Assign hotel owner details to the booking
    const hotelOwner = hotel.owner;

    const newBooking: any = {
      _id: 'bk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      bookingReference: bookingRef,
      userId: req.user ? req.user._id : 'usr_guest_' + Date.now().toString(36),
      hotelId: hotel._id,
      roomId: room._id,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim().toLowerCase(),
      guestPhone: (guestPhone || req.user?.phone || '').trim(),
      specialRequests: specialRequests ? specialRequests.trim() : undefined,
      checkIn,
      checkOut,
      numberOfGuests: numGuests,
      numberOfRooms: numRooms,
      priceBreakdown,
      paymentMethod: chosenMethod,
      paymentStatus,
      bookingStatus,
      hotelOwner,
      paymentInstructions: isCod
        ? 'Please present this booking reference and pay at the hotel during check-in.'
        : 'Please proceed with online payment verification.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local persistent document store
    db.bookings.unshift(newBooking);
    saveDb(db);

    // Save directly to MongoDB Atlas if connected
    let atlasSaved = false;
    if (isAtlasActive()) {
      try {
        await BookingModel.create(newBooking);
        atlasSaved = true;
        console.log(`[MongoDB Atlas] ✅ Booking ${bookingRef} persisted to Atlas collection [bookings]`);
      } catch (atlasErr: any) {
        console.error('⚠️  Failed to save booking to MongoDB Atlas:', atlasErr.message);
      }
    }

    console.log(`[Booking Created] Ref: ${bookingRef} | Method: ${chosenMethod} | Hotel: ${hotel.name} | Atlas: ${atlasSaved}`);

    // Automatically dispatch email notification to guest and hotel owner
    let emailStatus = { sent: false, recipient: newBooking.guestEmail };
    try {
      const emailResult = await sendBookingConfirmationNotification(newBooking, hotel, room);
      emailStatus.sent = emailResult.success;
    } catch (e) {
      console.error('Email dispatch error on booking creation:', e);
    }

    res.status(201).json({
      success: true,
      message: isCod
        ? 'Your room reservation has been placed successfully! Pay at the hotel during check-in.'
        : 'Booking reservation initialized. Please proceed to payment verification.',
      booking: newBooking,
      database: getDatabaseStatus(),
      atlasSaved,
      emailNotification: emailStatus,
      hotel: {
        name: hotel.name,
        city: hotel.city,
        coverImage: hotel.coverImage,
        address: hotel.address,
        owner: hotel.owner,
      },
      room: {
        roomType: room.roomType,
        bedType: room.bedType,
        images: room.images,
      },
    });
  } catch (err: any) {
    console.error('Error creating booking:', err);
    res.status(500).json({
      success: false,
      message: 'Server error processing booking reservation. ' + (err.message || ''),
    });
  }
}

// GET /api/my-bookings or GET /api/bookings/my-bookings
export async function getMyBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!._id;

    // 1. Try querying MongoDB Atlas
    if (isAtlasActive()) {
      try {
        const atlasBookings = await BookingModel.find({ userId })
          .sort({ createdAt: -1 })
          .lean();

        if (atlasBookings && atlasBookings.length > 0) {
          const hotels = await HotelModel.find({}).lean();
          const rooms = await RoomModel.find({}).lean();

          const enriched = atlasBookings.map((b: any) => {
            const hotel = hotels.find(h => h._id === b.hotelId);
            const room = rooms.find(r => r._id === b.roomId);
            return {
              ...b,
              hotelName: hotel ? hotel.name : 'Luxury ASVILLA Property',
              hotelCity: hotel ? hotel.city : '',
              hotelImage: hotel ? hotel.coverImage : '',
              hotelAddress: hotel ? hotel.address : '',
              cancellationPolicy: hotel ? hotel.cancellationPolicy : 'Standard cancellation policy applies.',
              hotelOwner: hotel?.owner || b.hotelOwner,
              roomType: room ? room.roomType : 'Luxury Suite',
              roomBed: room ? room.bedType : '',
            };
          });

          res.json({
            success: true,
            database: getDatabaseStatus(),
            data: enriched,
          });
          return;
        }
      } catch (err) {
        console.warn('Error fetching user bookings from Atlas:', err);
      }
    }

    // 2. Local fallback
    const db = await getDb();
    const userBookings = db.bookings
      .filter(b => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const enriched = userBookings.map(b => {
      const hotel = db.hotels.find(h => h._id === b.hotelId);
      const room = db.rooms.find(r => r._id === b.roomId);
      return {
        ...b,
        hotelName: hotel ? hotel.name : 'Luxury ASVILLA Property',
        hotelCity: hotel ? hotel.city : '',
        hotelImage: hotel ? hotel.coverImage : '',
        hotelAddress: hotel ? hotel.address : '',
        cancellationPolicy: hotel ? hotel.cancellationPolicy : 'Standard cancellation policy applies.',
        hotelOwner: hotel?.owner || b.hotelOwner,
        roomType: room ? room.roomType : 'Luxury Suite',
        roomBed: room ? room.bedType : '',
      };
    });

    res.json({
      success: true,
      database: getDatabaseStatus(),
      data: enriched,
    });
  } catch (err: any) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ success: false, message: 'Server error fetching bookings.' });
  }
}

// GET /api/bookings/:id
export async function getBookingById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // 1. Try querying MongoDB Atlas
    if (isAtlasActive()) {
      try {
        const atlasBooking: any = await BookingModel.findOne({
          $or: [{ _id: id }, { bookingReference: id }],
        }).lean();

        if (atlasBooking) {
          if (req.user && atlasBooking.userId !== req.user._id && req.user.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Access denied to this booking.' });
            return;
          }

          const hotel: any = await HotelModel.findOne({ _id: atlasBooking.hotelId }).lean();
          const room: any = await RoomModel.findOne({ _id: atlasBooking.roomId }).lean();
          const localDb = await getDb();
          const payment = localDb.payments.find(p => p.bookingId === atlasBooking._id);

          res.json({
            success: true,
            database: getDatabaseStatus(),
            data: {
              ...atlasBooking,
              hotelOwner: hotel?.owner || atlasBooking.hotelOwner,
              hotel,
              room,
              payment,
            },
          });
          return;
        }
      } catch (err) {
        console.warn('Error reading booking from Atlas:', err);
      }
    }

    // 2. Local fallback
    const db = await getDb();
    const booking = db.bookings.find(b => b._id === id || b.bookingReference === id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    // Ownership check (unless admin)
    if (req.user && booking.userId !== req.user._id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied to this booking.' });
      return;
    }

    const hotel = db.hotels.find(h => h._id === booking.hotelId);
    const room = db.rooms.find(r => r._id === booking.roomId);
    const payment = db.payments.find(p => p.bookingId === booking._id);

    res.json({
      success: true,
      database: getDatabaseStatus(),
      data: {
        ...booking,
        hotelOwner: hotel?.owner || booking.hotelOwner,
        hotel,
        room,
        payment,
      },
    });
  } catch (err: any) {
    console.error('Error fetching booking details:', err);
    res.status(500).json({ success: false, message: 'Server error fetching booking details.' });
  }
}

// PATCH /api/bookings/:id/cancel or POST /api/bookings/:id/cancel
export async function cancelBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const db = await getDb();
    const booking = db.bookings.find(b => b._id === id || b.bookingReference === id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (req.user && booking.userId !== req.user._id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    if (booking.bookingStatus === 'cancelled') {
      res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
      return;
    }

    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by guest request.';
    booking.cancelledAt = new Date().toISOString();

    if (booking.paymentStatus === 'success' || (booking.paymentStatus as any) === 'paid') {
      booking.paymentStatus = 'refunded';
      booking.refundAmount = booking.priceBreakdown.totalAmount;

      const payment = db.payments.find(p => p.bookingId === booking._id);
      if (payment) {
        payment.status = 'refunded';
      }
    }

    booking.updatedAt = new Date().toISOString();
    saveDb(db);

    // Sync to Atlas if connected
    if (isAtlasActive()) {
      try {
        await BookingModel.updateOne(
          { $or: [{ _id: id }, { bookingReference: id }] },
          {
            $set: {
              bookingStatus: 'cancelled',
              cancellationReason: booking.cancellationReason,
              cancelledAt: booking.cancelledAt,
              paymentStatus: booking.paymentStatus,
              refundAmount: booking.refundAmount,
            },
          }
        );
      } catch (err) {
        console.warn('Error updating booking in Atlas:', err);
      }
    }

    const hotel = db.hotels.find(h => h._id === booking.hotelId);
    if (hotel) {
      sendBookingCancellationNotification(booking, hotel, booking.refundAmount).catch(e =>
        console.error('Cancellation email error:', e)
      );
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully.',
      database: getDatabaseStatus(),
      booking,
    });
  } catch (err: any) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ success: false, message: 'Server error cancelling booking.' });
  }
}

// POST /api/bookings/:id/resend-email
export async function resendBookingEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await resendEmailService(id);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        notification: result.notification,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (err: any) {
    console.error('Error resending booking email:', err);
    res.status(500).json({ success: false, message: 'Server error resending email.' });
  }
}

// GET /api/bookings/:id/email-preview
export async function getBookingEmailPreview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const preview = await getEmailPreviewService(id);

    if (preview.success) {
      res.json(preview);
    } else {
      res.status(404).json({ success: false, message: 'Email preview not found for this booking.' });
    }
  } catch (err: any) {
    console.error('Error fetching email preview:', err);
    res.status(500).json({ success: false, message: 'Server error loading email preview.' });
  }
}

// GET /api/notifications
export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const notifications = db.notifications || [];

    if (!req.user) {
      res.json({ success: true, data: [] });
      return;
    }

    // Admins see all notifications; regular users see their own
    if (req.user.role === 'admin') {
      res.json({ success: true, data: notifications });
      return;
    }

    const userEmail = req.user.email.toLowerCase();
    const userNotifications = notifications.filter(
      n => n.recipientEmail.toLowerCase() === userEmail
    );

    res.json({ success: true, data: userNotifications });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
}
