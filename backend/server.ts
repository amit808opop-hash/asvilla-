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

dotenv.config({ override: true });

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(authenticateToken);

// Health check with live DB status
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: dbStatus.connected ? 'healthy' : 'degraded',
    platform: 'ASVILLA — Luxury Hotel Booking API',
    version: '2.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Primary Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.get('/api/my-bookings', requireAuth, getMyBookings);
app.get('/api/notifications', requireAuth, getNotifications);
app.get('/api/availability', checkAvailability);

// Centralized error handler
app.use('/api', errorHandler);

async function start() {
  // Await database connection before accepting requests
  console.log('🔄 Initializing database connection...');
  await connectDB();

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🏰 ASVILLA Backend API running on port ${PORT}`);
    });
  }
}

start().catch(err => {
  console.error('Fatal startup error in backend/server.ts:', err);
});

export default app;
