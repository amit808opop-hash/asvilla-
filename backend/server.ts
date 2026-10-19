import app from './app';
import { connectDB } from './config/db';

const PORT = Number(process.env.PORT) || 5000;

async function start() {
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
