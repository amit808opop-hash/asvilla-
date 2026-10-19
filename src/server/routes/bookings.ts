import { Router, Response } from 'express';
import { getDb, saveDb, checkRoomAvailability } from '../db';
import { Booking, PriceBreakdown } from '../types';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/availability
router.get('/availability', async (req, res): Promise<void> => {
  try {
    const { roomId, checkIn, checkOut, rooms = '1' } = req.query;

    if (!roomId || !checkIn || !checkOut) {
      res.status(400).json({
        success: false,
        message: 'roomId, checkIn, and checkOut are required query parameters.',
      });
      return;
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        message: 'Invalid dates. Check-out date must be strictly after check-in date.',
      });
      return;
    }

    const reqRooms = Math.max(1, parseInt(rooms as string, 10) || 1);
    const availability = await checkRoomAvailability(
      roomId as string,
      checkIn as string,
      checkOut as string,
      reqRooms
    );

    res.json({
      success: true,
      ...availability,
    });
  } catch (err: any) {
    console.error('Error checking availability:', err);
    res.status(500).json({ success: false, message: 'Server error checking room availability.' });
  }
});

// POST /api/bookings (Create booking reservation with server-calculated price)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    } = req.body;

    if (!hotelId || !roomId || !checkIn || !checkOut || !guestName || !guestEmail) {
      res.status(400).json({
        success: false,
        message: 'Hotel, room, dates, guest name, and email are required.',
      });
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        message: 'Invalid dates. Check-out date must be after check-in date.',
      });
      return;
    }

    const diffDays = Math.max(
      1,
      Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const db = await getDb();
    const hotel = db.hotels.find(h => h._id === hotelId);
    const room = db.rooms.find(r => r._id === roomId && r.hotelId === hotelId);

    if (!hotel || !room) {
      res.status(404).json({ success: false, message: 'Selected hotel or room type was not found.' });
      return;
    }

    const numRooms = Math.max(1, parseInt(String(numberOfRooms), 10) || 1);

    // 1. Check availability atomic check
    const availability = await checkRoomAvailability(roomId, checkIn, checkOut, numRooms);
    if (!availability.available) {
      res.status(409).json({
        success: false,
        message: `Only ${availability.remainingRooms} room(s) available for the selected dates. Please choose different dates or fewer rooms.`,
      });
      return;
    }

    // 2. Server-side trusted price calculation (NEVER trust frontend price)
    const basePrice = room.pricePerNight;
    const roomTotal = basePrice * diffDays * numRooms;
    const gstAmount = Math.round(roomTotal * 0.12); // 12% GST
    const serviceFee = 1500; // Luxury concierge and resort fee

    let discountAmount = 0;
    let appliedPromo: string | undefined = undefined;

    if (promoCode && typeof promoCode === 'string') {
      const cleanCode = promoCode.trim().toUpperCase();
      const offer = db.offers.find(o => o.code === cleanCode && o.isActive);
      if (offer && roomTotal >= offer.minBookingAmount) {
        discountAmount = Math.min(
          offer.maxDiscount,
          Math.round((roomTotal * offer.discountPercent) / 100)
        );
        appliedPromo = offer.code;
      }
    }

    const totalAmount = Math.max(0, roomTotal + gstAmount + serviceFee - discountAmount);

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

    // Generate unique booking reference
    const bookingRef = `ASV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: Booking = {
      _id: 'bk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      bookingReference: bookingRef,
      userId: req.user!._id,
      hotelId,
      roomId,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: (guestPhone || req.user!.phone || '').trim(),
      specialRequests: specialRequests ? specialRequests.trim() : undefined,
      checkIn,
      checkOut,
      numberOfGuests: Number(numberOfGuests) || 2,
      numberOfRooms: numRooms,
      priceBreakdown,
      paymentStatus: 'pending',
      bookingStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.bookings.unshift(newBooking);
    saveDb(db);

    res.status(201).json({
      success: true,
      message: 'Booking reservation initialized. Please proceed to payment verification.',
      booking: newBooking,
      hotel: {
        name: hotel.name,
        city: hotel.city,
        coverImage: hotel.coverImage,
        address: hotel.address,
      },
      room: {
        roomType: room.roomType,
        bedType: room.bedType,
        images: room.images,
      },
    });
  } catch (err: any) {
    console.error('Error creating booking:', err);
    res.status(500).json({ success: false, message: 'Server error processing booking reservation.' });
  }
});

// GET /api/bookings/my-bookings
router.get('/my-bookings', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const userBookings = db.bookings
      .filter(b => b.userId === req.user!._id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Enrich with hotel and room metadata
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
        roomType: room ? room.roomType : 'Luxury Suite',
        roomBed: room ? room.bedType : '',
      };
    });

    res.json({
      success: true,
      data: enriched,
    });
  } catch (err: any) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ success: false, message: 'Server error fetching bookings.' });
  }
});

// GET /api/bookings/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const booking = db.bookings.find(b => b._id === id || b.bookingReference === id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    // Ownership check (unless admin)
    if (booking.userId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied to this booking.' });
      return;
    }

    const hotel = db.hotels.find(h => h._id === booking.hotelId);
    const room = db.rooms.find(r => r._id === booking.roomId);
    const payment = db.payments.find(p => p.bookingId === booking._id);

    res.json({
      success: true,
      data: {
        ...booking,
        hotel,
        room,
        payment,
      },
    });
  } catch (err: any) {
    console.error('Error fetching booking details:', err);
    res.status(500).json({ success: false, message: 'Server error fetching booking details.' });
  }
});

// POST /api/bookings/:id/cancel
router.post('/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const db = await getDb();
    const booking = db.bookings.find(b => b._id === id || b.bookingReference === id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    // Ownership check
    if (booking.userId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    if (booking.bookingStatus === 'cancelled') {
      res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
      return;
    }

    // Update booking state
    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by guest request.';
    booking.cancelledAt = new Date().toISOString();

    // If payment was successful, mark refund status
    if (booking.paymentStatus === 'success') {
      booking.paymentStatus = 'refunded';
      booking.refundAmount = booking.priceBreakdown.totalAmount;

      const payment = db.payments.find(p => p.bookingId === booking._id);
      if (payment) {
        payment.status = 'refunded';
      }
    }

    booking.updatedAt = new Date().toISOString();
    saveDb(db);

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Your refund has been initiated to original payment source.',
      booking,
    });
  } catch (err: any) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ success: false, message: 'Server error cancelling booking.' });
  }
});

export default router;
