import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { connectDB, getDatabaseStatus } from './backend/config/db';
import authRoutes from './backend/routes/authRoutes';
import hotelRoutes from './backend/routes/hotelRoutes';
import bookingRoutes from './backend/routes/bookingRoutes';
import { getMyBookings, getNotifications } from './backend/controllers/bookingController';
import { checkAvailability } from './backend/controllers/hotelController';
import { authenticateToken, requireAuth } from './backend/middleware/authMiddleware';
import { errorHandler } from './backend/middleware/errorHandler';

import roomRoutes from './src/server/routes/rooms';
import paymentRoutes from './src/server/routes/payments';
import reviewRoutes from './src/server/routes/reviews';
import contactRoutes from './src/server/routes/contact';
import offerRoutes from './src/server/routes/offers';
import adminRoutes from './src/server/routes/admin';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Middlewares
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());

  // Attach auth context from Authorization Bearer token to all requests
  app.use(authenticateToken);

  // Initialize DB (MongoDB Atlas or persistent fallback)
  try {
    const dbStatus = await connectDB();
    console.log(`✨ ASVILLA Database active: ${dbStatus.type.toUpperCase()}`);
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  // Health check endpoint with database inspection
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
  
  // Explicit route alias requested: GET /api/my-bookings
  app.get('/api/my-bookings', requireAuth, getMyBookings);
  app.get('/api/notifications', requireAuth, getNotifications);

  // Direct availability route: GET /api/availability
  app.get('/api/availability', checkAvailability);

  app.use('/api/payments', paymentRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/offers', offerRoutes);
  app.use('/api/admin', adminRoutes);

  // Centralized Error Handling Middleware for APIs
  app.use('/api', errorHandler);

  // Frontend integration: Vite middleware in dev, static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏰 ASVILLA Server is running on port ${PORT}`);
    console.log(`🛎️  Mode: ${isProd ? 'Production' : 'Development'}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup failure:', err);
});
