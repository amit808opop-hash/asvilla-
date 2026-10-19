import { Request, Response } from 'express';
import { getDb, saveDb, checkRoomAvailability as checkLocalAvailability } from '../../src/server/db';
import { Hotel } from '../../src/server/types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { HotelModel, RoomModel } from '../models/Hotel';
import { BookingModel } from '../models/Booking';
import { isAtlasActive, getDatabaseStatus } from '../config/db';

/**
 * Check room availability with MongoDB Atlas or local document store
 */
export async function checkRoomAvailabilityDb(
  roomId: string,
  checkIn: string,
  checkOut: string,
  reqRooms: number
): Promise<{
  available: boolean;
  remainingRooms: number;
  totalRooms: number;
  bookedRooms: number;
}> {
  if (isAtlasActive()) {
    try {
      const room: any = await RoomModel.findOne({ _id: roomId }).lean();
      if (!room) {
        return { available: false, remainingRooms: 0, totalRooms: 0, bookedRooms: 0 };
      }

      // Check overlapping active reservations in MongoDB
      const overlappingBookings: any[] = await BookingModel.find({
        roomId,
        bookingStatus: { $in: ['confirmed', 'pending_confirmation', 'pending'] },
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
      }).lean();

      const bookedRooms = overlappingBookings.reduce((sum, b: any) => sum + (b.numberOfRooms || 1), 0);
      const remainingRooms = Math.max(0, (room.totalRooms || 5) - bookedRooms);

      return {
        available: remainingRooms >= reqRooms,
        remainingRooms,
        totalRooms: room.totalRooms || 5,
        bookedRooms,
      };
    } catch (err) {
      console.warn('Error querying room availability in Atlas, checking document store:', err);
    }
  }

  return checkLocalAvailability(roomId, checkIn, checkOut, reqRooms);
}

// GET /api/hotels
export async function getAllHotels(req: Request, res: Response): Promise<void> {
  try {
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

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 12);
    const dbStatus = getDatabaseStatus();

    // 1. Try querying MongoDB Atlas first if connected
    if (isAtlasActive()) {
      try {
        const query: any = { published: true };

        if (city && typeof city === 'string' && city.trim() !== '' && city.toLowerCase() !== 'all') {
          query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
        }

        if (search && typeof search === 'string' && search.trim() !== '') {
          const q = search.trim();
          query.$or = [
            { name: { $regex: q, $options: 'i' } },
            { city: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { address: { $regex: q, $options: 'i' } },
          ];
        }

        if (minPrice && !isNaN(Number(minPrice))) {
          query.priceStartingFrom = { ...query.priceStartingFrom, $gte: Number(minPrice) };
        }
        if (maxPrice && !isNaN(Number(maxPrice))) {
          query.priceStartingFrom = { ...query.priceStartingFrom, $lte: Number(maxPrice) };
        }
        if (starRating && !isNaN(Number(starRating))) {
          query.starRating = { $gte: Number(starRating) };
        }
        if (minRating && !isNaN(Number(minRating))) {
          query.guestRating = { $gte: Number(minRating) };
        }
        if (featured === 'true') {
          query.featured = true;
        }

        let sortOption: any = { reviewCount: -1 };
        switch (sort) {
          case 'price_asc':
            sortOption = { priceStartingFrom: 1 };
            break;
          case 'price_desc':
            sortOption = { priceStartingFrom: -1 };
            break;
          case 'rating_desc':
            sortOption = { guestRating: -1 };
            break;
          case 'popularity':
          default:
            sortOption = { reviewCount: -1 };
            break;
        }

        const totalCount = await HotelModel.countDocuments(query);
        const hotels = await HotelModel.find(query)
          .sort(sortOption)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean();

        if (hotels && hotels.length > 0) {
          const hotelIds = hotels.map(h => h._id);
          const rooms = await RoomModel.find({ hotelId: { $in: hotelIds }, isAvailable: true }).lean();

          const enrichedHotels = hotels.map(h => ({
            ...h,
            rooms: rooms.filter(r => r.hotelId === h._id),
          }));

          res.json({
            success: true,
            database: dbStatus,
            data: enrichedHotels,
            pagination: {
              total: totalCount,
              page: pageNum,
              limit: limitNum,
              totalPages: Math.ceil(totalCount / limitNum),
            },
          });
          return;
        }
      } catch (mongoErr) {
        console.warn('Error reading hotels from MongoDB Atlas, falling back to local cache:', mongoErr);
      }
    }

    // 2. Local high-performance persistent store
    const db = await getDb();
    let hotels = [...db.hotels].filter(h => h.published);

    if (city && typeof city === 'string' && city.trim() !== '' && city.toLowerCase() !== 'all') {
      hotels = hotels.filter(h => h.city.toLowerCase() === city.toLowerCase().trim());
    }

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

    if (minPrice && !isNaN(Number(minPrice))) {
      hotels = hotels.filter(h => h.priceStartingFrom >= Number(minPrice));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      hotels = hotels.filter(h => h.priceStartingFrom <= Number(maxPrice));
    }
    if (starRating && !isNaN(Number(starRating))) {
      hotels = hotels.filter(h => h.starRating >= Number(starRating));
    }
    if (minRating && !isNaN(Number(minRating))) {
      hotels = hotels.filter(h => h.guestRating >= Number(minRating));
    }
    if (featured === 'true') {
      hotels = hotels.filter(h => h.featured);
    }

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
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedHotels = hotels.slice(startIndex, startIndex + limitNum);

    const enrichedHotels = paginatedHotels.map(h => ({
      ...h,
      rooms: db.rooms.filter(r => r.hotelId === h._id && r.isAvailable),
    }));

    res.json({
      success: true,
      database: dbStatus,
      data: enrichedHotels,
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
}

// GET /api/hotels/:id
export async function getHotelById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const dbStatus = getDatabaseStatus();

    // 1. Try querying MongoDB Atlas
    if (isAtlasActive()) {
      try {
        const hotel: any = await HotelModel.findOne({
          $or: [{ _id: id }, { slug: id }],
        }).lean();

        if (hotel) {
          const rooms: any[] = await RoomModel.find({ hotelId: hotel._id, isAvailable: true }).lean();
          const localDb = await getDb();
          const reviews = localDb.reviews ? localDb.reviews.filter(r => r.hotelId === hotel._id) : [];

          res.json({
            success: true,
            database: dbStatus,
            data: {
              ...hotel,
              rooms,
              reviews,
            },
          });
          return;
        }
      } catch (err) {
        console.warn('Error reading single hotel from Atlas:', err);
      }
    }

    // 2. Local document store fallback
    const db = await getDb();
    const hotel = db.hotels.find(h => h._id === id || h.slug === id);
    if (!hotel) {
      res.status(404).json({ success: false, message: 'Hotel not found.' });
      return;
    }

    const rooms = db.rooms.filter(r => r.hotelId === hotel._id && r.isAvailable);
    const reviews = db.reviews ? db.reviews.filter(r => r.hotelId === hotel._id) : [];

    res.json({
      success: true,
      database: dbStatus,
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
}

// GET /api/availability
export async function checkAvailability(req: Request, res: Response): Promise<void> {
  try {
    const { roomId, checkIn, checkOut, rooms = '1' } = req.query;

    if (!roomId || !checkIn || !checkOut) {
      res.status(400).json({
        success: false,
        message: 'roomId, checkIn, and checkOut are required parameters.',
      });
      return;
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        message: 'Invalid dates. Check-out must be after check-in.',
      });
      return;
    }

    const reqRooms = Math.max(1, parseInt(rooms as string, 10) || 1);
    const result = await checkRoomAvailabilityDb(
      roomId as string,
      checkIn as string,
      checkOut as string,
      reqRooms
    );

    res.json({
      success: true,
      database: getDatabaseStatus(),
      ...result,
    });
  } catch (err: any) {
    console.error('Availability check error:', err);
    res.status(500).json({ success: false, message: 'Server error checking availability.' });
  }
}
