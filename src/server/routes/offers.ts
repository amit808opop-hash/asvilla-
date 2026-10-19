import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

// GET /api/offers
router.get('/', async (req, res): Promise<void> => {
  try {
    const db = await getDb();
    const activeOffers = db.offers.filter(o => o.isActive);
    res.json({ success: true, data: activeOffers });
  } catch (err: any) {
    console.error('Error fetching offers:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving offers.' });
  }
});

export default router;
