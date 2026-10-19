import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
} from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
router.get('/me', requireAuth, getMe);

// PUT /api/auth/profile
router.put('/profile', requireAuth, updateProfile);

export default router;
