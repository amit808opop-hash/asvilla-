import { Router, Response } from 'express';
import { getDb, saveDb } from '../db';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply requireAdmin to all admin routes
router.use(requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();

    const totalHotels = db.hotels.length;
    const totalRooms = db.rooms.length;
    const totalBookings = db.bookings.length;
    const confirmedBookings = db.bookings.filter(b => b.bookingStatus === 'confirmed').length;
    const pendingPayments = db.bookings.filter(b => b.paymentStatus === 'pending').length;
    const registeredUsers = db.users.length;

    // Calculate verified revenue from captured payments
    const verifiedPayments = db.payments.filter(p => p.status === 'captured');
    const totalRevenue = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Recent 5 bookings
    const recentBookings = [...db.bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map(b => {
        const hotel = db.hotels.find(h => h._id === b.hotelId);
        return {
          ...b,
          hotelName: hotel ? hotel.name : 'Unknown Hotel',
        };
      });

    res.json({
      success: true,
      stats: {
        totalHotels,
        totalRooms,
        totalBookings,
        confirmedBookings,
        pendingPayments,
        totalRevenue,
        registeredUsers,
      },
      recentBookings,
    });
  } catch (err: any) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving admin statistics.' });
  }
});

// GET /api/admin/bookings
router.get('/bookings', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, search, startDate, endDate } = req.query;
    const db = await getDb();

    let bookings = [...db.bookings];

    if (status && typeof status === 'string' && status !== 'all') {
      bookings = bookings.filter(b => b.bookingStatus === status || b.paymentStatus === status);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      bookings = bookings.filter(
        b =>
          b.bookingReference.toLowerCase().includes(q) ||
          b.guestName.toLowerCase().includes(q) ||
          b.guestEmail.toLowerCase().includes(q)
      );
    }

    if (startDate && typeof startDate === 'string') {
      bookings = bookings.filter(b => new Date(b.checkIn) >= new Date(startDate));
    }

    if (endDate && typeof endDate === 'string') {
      bookings = bookings.filter(b => new Date(b.checkOut) <= new Date(endDate));
    }

    // Sort newest first
    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const enriched = bookings.map(b => {
      const hotel = db.hotels.find(h => h._id === b.hotelId);
      const room = db.rooms.find(r => r._id === b.roomId);
      return {
        ...b,
        hotelName: hotel ? hotel.name : 'Unknown Hotel',
        hotelCity: hotel ? hotel.city : '',
        roomType: room ? room.roomType : 'Standard Room',
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    console.error('Admin bookings error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving bookings.' });
  }
});

// PUT /api/admin/bookings/:id/status
router.put('/bookings/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { bookingStatus, paymentStatus } = req.body;
    const db = await getDb();

    const booking = db.bookings.find(b => b._id === id || b.bookingReference === id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (bookingStatus) {
      booking.bookingStatus = bookingStatus;
    }
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }
    booking.updatedAt = new Date().toISOString();

    saveDb(db);

    res.json({
      success: true,
      message: 'Booking status updated successfully.',
      booking,
    });
  } catch (err: any) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ success: false, message: 'Server error updating booking status.' });
  }
});

// GET /api/admin/users
router.get('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const sanitized = db.users.map(u => {
      const { passwordHash: _, ...rest } = u;
      return rest;
    });

    res.json({ success: true, data: sanitized });
  } catch (err: any) {
    console.error('Admin users error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving users.' });
  }
});

// GET /api/admin/reports
router.get('/reports', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();

    // 1. Monthly revenue and booking count
    const monthlyStats: Record<string, { month: string; revenue: number; bookings: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    months.forEach((m, idx) => {
      const key = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      monthlyStats[key] = { month: `${m} ${currentYear}`, revenue: 0, bookings: 0 };
    });

    db.bookings.forEach(b => {
      const date = new Date(b.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyStats[key]) {
        monthlyStats[key].bookings += 1;
        if (b.paymentStatus === 'success') {
          monthlyStats[key].revenue += b.priceBreakdown.totalAmount;
        }
      }
    });

    // 2. City-wise occupancy and bookings
    const cityBreakdown: Record<string, { city: string; bookings: number; revenue: number }> = {};
    db.bookings.forEach(b => {
      const hotel = db.hotels.find(h => h._id === b.hotelId);
      const city = hotel ? hotel.city : 'Other';
      if (!cityBreakdown[city]) {
        cityBreakdown[city] = { city, bookings: 0, revenue: 0 };
      }
      cityBreakdown[city].bookings += 1;
      if (b.paymentStatus === 'success') {
        cityBreakdown[city].revenue += b.priceBreakdown.totalAmount;
      }
    });

    res.json({
      success: true,
      monthly: Object.values(monthlyStats),
      byCity: Object.values(cityBreakdown),
    });
  } catch (err: any) {
    console.error('Admin reports error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving reports.' });
  }
});

export default router;
