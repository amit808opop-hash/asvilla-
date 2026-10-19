import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, saveDb } from '../db';
import { User } from '../types';
import { AuthenticatedRequest, JWT_SECRET, requireAuth } from '../middleware/auth';

const router = Router();

// Store temporary password reset tokens (token -> { email, expiresAt })
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

// Helper to sanitize user object
function sanitizeUser(user: User) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

// POST /api/auth/register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Passwords do not match.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    const db = await getDb();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);

    const token = jwt.sign({ userId: newUser._id, role: newUser.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to ASVILLA.',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const db = await getDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      message: 'Welcome back, ' + user.name,
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    success: true,
    user: sanitizeUser(req.user!),
  });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, phone } = req.body;
    if (!name || name.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      return;
    }

    const db = await getDb();
    const userIndex = db.users.findIndex(u => u._id === req.user!._id);
    if (userIndex === -1) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    db.users[userIndex].name = name.trim();
    if (phone !== undefined) {
      db.users[userIndex].phone = phone.trim();
    }
    db.users[userIndex].updatedAt = new Date().toISOString();

    saveDb(db);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: sanitizeUser(db.users[userIndex]),
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

// PUT /api/auth/password
router.put('/password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      return;
    }

    const db = await getDb();
    const user = db.users.find(u => u._id === req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password does not match.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date().toISOString();
    saveDb(db);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Password update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const db = await getDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      // Avoid user enumeration
      res.json({
        success: true,
        message: 'If an account exists with this email, a reset code has been sent.',
      });
      return;
    }

    const resetToken = 'rst_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    resetTokens.set(resetToken, {
      email: user.email,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
    });

    res.json({
      success: true,
      message: 'Password reset code generated.',
      // Provided in response for easy demonstration/testing without SMTP server
      demoResetToken: resetToken,
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const resetData = resetTokens.get(token);
    if (!resetData || resetData.expiresAt < Date.now()) {
      res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
      return;
    }

    const db = await getDb();
    const user = db.users.find(u => u.email.toLowerCase() === resetData.email.toLowerCase());
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date().toISOString();
    saveDb(db);

    resetTokens.delete(token);

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
});

export default router;
