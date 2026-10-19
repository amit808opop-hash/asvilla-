import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDatabaseStatus } from './config/db';
import authRoutes from './routes/authRoutes';
import hotelRoutes from './routes/hotelRoutes';
import bookingRoutes from './routes/bookingRoutes';
import { getMyBookings, getNotifications } from './controllers/bookingController';
import { checkAvailability } from './controllers/hotelController';
import { authenticateToken, requireAuth } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';

import roomRoutes from '../src/server/routes/rooms';
import paymentRoutes from '../src/server/routes/payments';
import reviewRoutes from '../src/server/routes/reviews';
import contactRoutes from '../src/server/routes/contact';
import offerRoutes from '../src/server/routes/offers';
import adminRoutes from '../src/server/routes/admin';

dotenv.config({ override: true });

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(authenticateToken);

// Middleware to ensure database connection is established in serverless environments (Vercel)
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless DB connection notice:', err);
  }
  next();
});

// Health check with live DB status
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: dbStatus.connected ? 'healthy' : 'degraded',
    platform: 'ASVILLA — Luxury Hotel Booking Platform',
    version: '2.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Primary API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/hotels', reviewRoutes); // /api/hotels/:hotelId/reviews
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.get('/api/my-bookings', requireAuth, getMyBookings);
app.get('/api/notifications', requireAuth, getNotifications);
app.get('/api/availability', checkAvailability);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/admin', adminRoutes);

// Centralized error handler
app.use('/api', errorHandler);

export default app;
