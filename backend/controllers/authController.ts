import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, saveDb } from '../../src/server/db';
import { User } from '../../src/server/types';
import { AuthenticatedRequest, JWT_SECRET } from '../middleware/authMiddleware';
import { UserModel } from '../models/User';
import { isAtlasActive, getDatabaseStatus } from '../config/db';

function sanitizeUser(user: any) {
  if (!user) return null;
  const safe = { ...user };
  delete safe.passwordHash;
  delete safe.__v;
  return safe;
}

export async function register(req: Request, res: Response): Promise<void> {
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

    const normalizedEmail = email.toLowerCase().trim();

    // Check Atlas or local DB for existing account
    if (isAtlasActive()) {
      try {
        const existingMongo = await UserModel.findOne({ email: normalizedEmail });
        if (existingMongo) {
          res.status(409).json({ success: false, message: 'An account with this email already exists.' });
          return;
        }
      } catch (err) {
        console.warn('Atlas user lookup error:', err);
      }
    }

    const db = await getDb();
    const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : undefined,
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local DB
    db.users.push(newUser);
    saveDb(db);

    // Save to MongoDB Atlas if active
    if (isAtlasActive()) {
      try {
        await UserModel.create(newUser);
        console.log(`[MongoDB Atlas] ✅ User ${newUser.email} persisted to Atlas collection [users]`);
      } catch (err: any) {
        if (err.code === 11000) {
          res.status(409).json({ success: false, message: 'An account with this email already exists in Atlas.' });
          return;
        }
        console.warn('Error creating user in Atlas:', err);
      }
    }

    const token = jwt.sign({ userId: newUser._id, role: newUser.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to ASVILLA.',
      database: getDatabaseStatus(),
      token,
      user: sanitizeUser(newUser),
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: err.message ? `Server error during registration: ${err.message}` : 'Server error during registration.',
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user: any = null;

    // Check Atlas first
    if (isAtlasActive()) {
      try {
        user = await UserModel.findOne({ email: normalizedEmail }).lean();
      } catch (err) {
        console.warn('Atlas login lookup error:', err);
      }
    }

    // Fallback to local DB
    if (!user) {
      const db = await getDb();
      user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    }

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
      database: getDatabaseStatus(),
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    success: true,
    database: getDatabaseStatus(),
    user: sanitizeUser(req.user!),
  });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    // Sync to Atlas if active
    if (isAtlasActive()) {
      try {
        await UserModel.updateOne(
          { _id: req.user!._id },
          { $set: { name: name.trim(), phone: phone ? phone.trim() : undefined, updatedAt: new Date() } }
        );
      } catch (err) {
        console.warn('Error updating profile in Atlas:', err);
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      database: getDatabaseStatus(),
      user: sanitizeUser(db.users[userIndex]),
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
}
