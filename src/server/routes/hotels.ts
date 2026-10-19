import { Router, Response } from 'express';
import { getDb, saveDb } from '../db';
import { Hotel } from '../types';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/hotels (with search, filter, sort, pagination)
router.get('/', async (req, res): Promise<void> => {
  try {
    const db = await getDb();
    let hotels = [...db.hotels].filter(h => h.published);

    const {
      city,
      minPrice,
      maxPrice,
      starRating,
      minRating,
      amenity,
      search,
      sort,
      featured,
      page = '1',
      limit = '12',
    } = req.query;

    // Filter by city
    if (city && typeof city === 'string' && city.trim() !== '' && city.toLowerCase() !== 'all') {
      hotels = hotels.filter(h => h.city.toLowerCase() === city.toLowerCase().trim());
    }

    // Filter by search query (name, description, city, address)
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      hotels = hotels.filter(
        h =>
          h.name.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q)
      );
    }

    // Filter by min price
    if (minPrice && !isNaN(Number(minPrice))) {
      hotels = hotels.filter(h => h.priceStartingFrom >= Number(minPrice));
    }

    // Filter by max price
    if (maxPrice && !isNaN(Number(maxPrice))) {
      hotels = hotels.filter(h => h.priceStartingFrom <= Number(maxPrice));
    }

    // Filter by star rating (e.g. 4 or 5)
    if (starRating && !isNaN(Number(starRating))) {
      hotels = hotels.filter(h => h.starRating >= Number(starRating));
    }

    // Filter by guest rating (e.g. 4.5+)
    if (minRating && !isNaN(Number(minRating))) {
      hotels = hotels.filter(h => h.guestRating >= Number(minRating));
    }

    // Filter by amenity
    if (amenity && typeof amenity === 'string') {
      const amenitiesList = amenity.split(',').map(a => a.trim().toLowerCase());
      hotels = hotels.filter(h =>
        amenitiesList.every(reqAmenity =>
          h.amenities.some(ha => ha.toLowerCase().includes(reqAmenity))
        )
      );
    }

    // Filter featured
    if (featured === 'true') {
      hotels = hotels.filter(h => h.featured);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        hotels.sort((a, b) => a.priceStartingFrom - b.priceStartingFrom);
        break;
      case 'price_desc':
        hotels.sort((a, b) => b.priceStartingFrom - a.priceStartingFrom);
        break;
      case 'rating_desc':
        hotels.sort((a, b) => b.guestRating - a.guestRating);
        break;
      case 'popularity':
      default:
        hotels.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    const totalCount = hotels.length;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 12);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedHotels = hotels.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedHotels,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err: any) {
    console.error('Error fetching hotels:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving hotels.' });
  }
});

// GET /api/hotels/:id
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    // Find hotel by ID or slug
    const hotel = db.hotels.find(h => h._id === id || h.slug === id);
    if (!hotel) {
      res.status(404).json({ success: false, message: 'Hotel not found.' });
      return;
    }

    // Attach rooms for this hotel
    const rooms = db.rooms.filter(r => r.hotelId === hotel._id && r.isAvailable);

    // Attach reviews for this hotel
    const reviews = db.reviews.filter(r => r.hotelId === hotel._id);

    res.json({
      success: true,
      data: {
        ...hotel,
        rooms,
        reviews,
      },
    });
  } catch (err: any) {
    console.error('Error fetching hotel details:', err);
    res.status(500).json({ success: false, message: 'Server error fetching hotel details.' });
  }
});

// POST /api/hotels (Admin only)
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      checkInTime = '14:00',
      checkOutTime = '12:00',
      cancellationPolicy = 'Free cancellation up to 48 hours before check-in.',
      petFriendly = false,
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
      checkInTime,
      checkOutTime,
      cancellationPolicy,
      petFriendly: Boolean(petFriendly),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.hotels.unshift(newHotel);
    saveDb(db);

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully.',
      data: newHotel,
    });
  } catch (err: any) {
    console.error('Error creating hotel:', err);
    res.status(500).json({ success: false, message: 'Server error creating hotel.' });
  }
});

// PUT /api/hotels/:id (Admin only)
router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const index = db.hotels.findIndex(h => h._id === id);

    if (index === -1) {
      res.status(404).json({ success: false, message: 'Hotel not found.' });
      return;
    }

    const current = db.hotels[index];
    const updated: Hotel = {
      ...current,
      ...req.body,
      _id: current._id, // Protect ID
      updatedAt: new Date().toISOString(),
    };

    db.hotels[index] = updated;
    saveDb(db);

    res.json({
      success: true,
      message: 'Hotel updated successfully.',
      data: updated,
    });
  } catch (err: any) {
    console.error('Error updating hotel:', err);
    res.status(500).json({ success: false, message: 'Server error updating hotel.' });
  }
});

// DELETE /api/hotels/:id (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    res.json({
      success: true,
      message: 'Hotel deleted successfully.',
      data: deleted,
    });
  } catch (err: any) {
    console.error('Error deleting hotel:', err);
    res.status(500).json({ success: false, message: 'Server error deleting hotel.' });
  }
});

export default router;
