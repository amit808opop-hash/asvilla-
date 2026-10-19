import { Router, Response } from 'express';
import { getDb, saveDb, checkRoomAvailability } from '../db';
import { Room } from '../types';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/rooms/:id
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const room = db.rooms.find(r => r._id === id);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found.' });
      return;
    }

    res.json({ success: true, data: room });
  } catch (err: any) {
    console.error('Error fetching room:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving room details.' });
  }
});

// POST /api/rooms (Admin only)
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      hotelId,
      roomType,
      description,
      pricePerNight,
      capacity,
      totalRooms = 5,
      bedType = 'King Bed',
      sizeSqFt = 450,
      images,
      amenities,
    } = req.body;

    if (!hotelId || !roomType || !pricePerNight) {
      res.status(400).json({
        success: false,
        message: 'hotelId, roomType, and pricePerNight are required.',
      });
      return;
    }

    const db = await getDb();
    const hotel = db.hotels.find(h => h._id === hotelId);
    if (!hotel) {
      res.status(404).json({ success: false, message: 'Parent hotel not found.' });
      return;
    }

    const slug = roomType.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newRoom: Room = {
      _id: 'rm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 5),
      hotelId,
      roomType: roomType.trim(),
      slug,
      description: description || '',
      pricePerNight: Number(pricePerNight),
      capacity: capacity || { adults: 2, children: 1, total: 3 },
      totalRooms: Number(totalRooms) || 5,
      bedType,
      sizeSqFt: Number(sizeSqFt) || 450,
      images: Array.isArray(images) && images.length > 0 ? images : hotel.images,
      amenities: Array.isArray(amenities) ? amenities : ['Air Conditioning', 'Ensuite Bathroom', 'Wi-Fi'],
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.rooms.push(newRoom);
    saveDb(db);

    res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      data: newRoom,
    });
  } catch (err: any) {
    console.error('Error creating room:', err);
    res.status(500).json({ success: false, message: 'Server error creating room.' });
  }
});

// PUT /api/rooms/:id (Admin only)
router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const index = db.rooms.findIndex(r => r._id === id);

    if (index === -1) {
      res.status(404).json({ success: false, message: 'Room not found.' });
      return;
    }

    const current = db.rooms[index];
    const updated: Room = {
      ...current,
      ...req.body,
      _id: current._id, // Protect ID
      updatedAt: new Date().toISOString(),
    };

    db.rooms[index] = updated;
    saveDb(db);

    res.json({
      success: true,
      message: 'Room updated successfully.',
      data: updated,
    });
  } catch (err: any) {
    console.error('Error updating room:', err);
    res.status(500).json({ success: false, message: 'Server error updating room.' });
  }
});

// DELETE /api/rooms/:id (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const index = db.rooms.findIndex(r => r._id === id);

    if (index === -1) {
      res.status(404).json({ success: false, message: 'Room not found.' });
      return;
    }

    const deleted = db.rooms.splice(index, 1)[0];
    saveDb(db);

    res.json({
      success: true,
      message: 'Room deleted successfully.',
      data: deleted,
    });
  } catch (err: any) {
    console.error('Error deleting room:', err);
    res.status(500).json({ success: false, message: 'Server error deleting room.' });
  }
});

export default router;
