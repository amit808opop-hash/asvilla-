import { Router, Response } from 'express';
import { getDb, saveDb } from '../db';
import { Review } from '../types';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/hotels/:id/reviews
router.get('/:hotelId/reviews', async (req, res): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const db = await getDb();
    const reviews = db.reviews.filter(r => r.hotelId === hotelId);
    res.json({ success: true, data: reviews });
  } catch (err: any) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving reviews.' });
  }
});

// POST /api/hotels/:id/reviews
router.post('/:hotelId/reviews', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { rating, title, comment } = req.body;

    if (!rating || !comment) {
      res.status(400).json({ success: false, message: 'Rating and comment are required.' });
      return;
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
      return;
    }

    const db = await getDb();
    const hotel = db.hotels.find(h => h._id === hotelId);
    if (!hotel) {
      res.status(404).json({ success: false, message: 'Hotel not found.' });
      return;
    }

    const newReview: Review = {
      _id: 'rev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 5),
      hotelId,
      userId: req.user!._id,
      userName: req.user!.name,
      rating: numRating,
      title: title ? title.trim() : 'Guest Experience',
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    db.reviews.unshift(newReview);

    // Update hotel average rating and count
    const allHotelReviews = db.reviews.filter(r => r.hotelId === hotelId);
    const avg = allHotelReviews.reduce((sum, r) => sum + r.rating, 0) / allHotelReviews.length;
    hotel.guestRating = Math.round(avg * 10) / 10;
    hotel.reviewCount = allHotelReviews.length;

    saveDb(db);

    res.status(201).json({
      success: true,
      message: 'Thank you for submitting your review!',
      data: newReview,
    });
  } catch (err: any) {
    console.error('Error submitting review:', err);
    res.status(500).json({ success: false, message: 'Server error saving review.' });
  }
});

export default router;
