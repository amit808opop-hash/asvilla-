import { Router } from 'express';
import {
  getAllHotels,
  getHotelById,
  checkAvailability,
} from '../controllers/hotelController';
import { getDb, saveDb } from '../../src/server/db';
import { Hotel } from '../../src/server/types';
import { requireAdmin, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/hotels
router.get('/', getAllHotels);

// GET /api/hotels/:id
router.get('/:id', getHotelById);

// GET /api/hotels/:id/rooms
router.get('/:id/rooms', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const rooms = db.rooms.filter(r => r.hotelId === id && r.isAvailable);
    res.json({ success: true, data: rooms });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving rooms.' });
  }
});

// Admin routes for Hotel management
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const {
      name,
      tagline,
      description,
      address,
      city,
      state,
      country = 'India',
      pincode,
      coverImage,
      images,
      amenities,
      starRating,
      priceStartingFrom,
      featured = false,
    } = req.body;

    if (!name || !city || !description || !priceStartingFrom || !coverImage) {
      res.status(400).json({
        success: false,
        message: 'Name, city, description, price, and cover image are required.',
      });
      return;
    }

    const db = await getDb();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newHotel: Hotel = {
      _id: 'htl_' + Date.now().toString(36),
      name: name.trim(),
      slug: slug + '-' + Math.random().toString(36).substring(2, 6),
      tagline: tagline || '',
      description: description.trim(),
      address: address || '',
      city: city.trim(),
      state: state || '',
      country,
      pincode: pincode || '',
      latitude: req.body.latitude || 20.5937,
      longitude: req.body.longitude || 78.9629,
      coverImage: coverImage.trim(),
      images: Array.isArray(images) && images.length > 0 ? images : [coverImage.trim()],
      amenities: Array.isArray(amenities) ? amenities : ['Complimentary WiFi', 'Luxury Dining'],
      starRating: Number(starRating) || 5,
      guestRating: 5.0,
      reviewCount: 0,
      featured: Boolean(featured),
      published: true,
      priceStartingFrom: Number(priceStartingFrom),
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
      petFriendly: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.hotels.unshift(newHotel);
    saveDb(db);

    res.status(201).json({ success: true, data: newHotel });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error creating hotel.' });
  }
});

router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const index = db.hotels.findIndex(h => h._id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Hotel not found.' });
      return;
    }

    db.hotels[index] = {
      ...db.hotels[index],
      ...req.body,
      _id: db.hotels[index]._id,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);

    res.json({ success: true, data: db.hotels[index] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error updating hotel.' });
  }
});

router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const index = db.hotels.findIndex(h => h._id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Hotel not found.' });
      return;
    }

    const deleted = db.hotels.splice(index, 1)[0];
    saveDb(db);

    res.json({ success: true, data: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error deleting hotel.' });
  }
});

export default router;
