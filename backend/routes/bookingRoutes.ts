import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  resendBookingEmail,
  getBookingEmailPreview,
  getNotifications,
} from '../controllers/bookingController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// POST /api/bookings
router.post('/', createBooking);

// GET /api/bookings/my-bookings
router.get('/my-bookings', requireAuth, getMyBookings);

// GET /api/bookings/notifications (In-app notifications inbox)
router.get('/notifications', requireAuth, getNotifications);

// GET /api/bookings/:id
router.get('/:id', getBookingById);

// POST /api/bookings/:id/resend-email
router.post('/:id/resend-email', requireAuth, resendBookingEmail);

// GET /api/bookings/:id/email-preview
router.get('/:id/email-preview', requireAuth, getBookingEmailPreview);

// PATCH & POST /api/bookings/:id/cancel
router.patch('/:id/cancel', requireAuth, cancelBooking);
router.post('/:id/cancel', requireAuth, cancelBooking);

export default router;
