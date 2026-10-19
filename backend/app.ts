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

// Full CORS configuration with preflight handling
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.options('*', cors());

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
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: dbStatus.connected ? 'healthy' : 'degraded',
    platform: 'ASVILLA — Luxury Hotel Booking Platform',
    version: '2.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Primary API Routes - Mount both with and without '/api' prefix for universal Vercel compatibility
const routeList = [
  { path: '/auth', router: authRoutes },
  { path: '/hotels', router: hotelRoutes },
  { path: '/hotels', router: reviewRoutes }, // /hotels/:hotelId/reviews
  { path: '/rooms', router: roomRoutes },
  { path: '/bookings', router: bookingRoutes },
  { path: '/payments', router: paymentRoutes },
  { path: '/contact', router: contactRoutes },
  { path: '/offers', router: offerRoutes },
  { path: '/admin', router: adminRoutes },
];

routeList.forEach(({ path: rPath, router }) => {
  app.use(`/api${rPath}`, router);
  app.use(rPath, router);
});

app.get(['/api/my-bookings', '/my-bookings'], requireAuth, getMyBookings);
app.get(['/api/notifications', '/notifications'], requireAuth, getNotifications);
app.get(['/api/availability', '/availability'], checkAvailability);

// Centralized error handler
app.use(['/api', '/'], errorHandler);

export default app;
