import { Router, Response } from 'express';
import { getDb, saveDb } from '../db';
import { ContactMessage } from '../types';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth';

const router = Router();

// POST /api/contact
router.post('/', async (req, res): Promise<void> => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required fields.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    const db = await getDb();
    const newMessage: ContactMessage = {
      _id: 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      subject: subject.trim(),
      message: message.trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    db.contactMessages.unshift(newMessage);
    saveDb(db);

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out to ASVILLA Concierge. Your inquiry has been received and our team will respond within 24 hours.',
      inquiryId: newMessage._id,
    });
  } catch (err: any) {
    console.error('Contact inquiry error:', err);
    res.status(500).json({ success: false, message: 'Server error saving inquiry.' });
  }
});

// GET /api/contact (Admin only)
router.get('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    res.json({ success: true, data: db.contactMessages });
  } catch (err: any) {
    console.error('Error fetching contact messages:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving contact inquiries.' });
  }
});

export default router;
