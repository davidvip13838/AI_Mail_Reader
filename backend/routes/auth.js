import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name: name || email.split('@')[0]
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        hasGmailAuth: !!user.gmailAccessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// Get current user profile (protected route)
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        hasGmailAuth: !!user.gmailAccessToken,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
});

// Update user profile (protected route)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (preferences !== undefined) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

// Update Gmail tokens (protected route)
router.put('/gmail-tokens', authenticate, async (req, res) => {
  try {
    const { accessToken, refreshToken, expiresIn } = req.body;

    const updateData = {};
    if (accessToken !== undefined) updateData.gmailAccessToken = accessToken;
    if (refreshToken !== undefined) updateData.gmailRefreshToken = refreshToken;
    if (expiresIn) {
      updateData.gmailTokenExpiry = new Date(expiresIn);
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Gmail tokens updated successfully',
      hasGmailAuth: !!user.gmailAccessToken
    });
  } catch (error) {
    console.error('Update Gmail tokens error:', error);
    res.status(500).json({ error: 'Failed to update Gmail tokens', details: error.message });
  }
});

// Logout (client-side token removal, but we can add token blacklisting here if needed)
router.post('/logout', authenticate, async (req, res) => {
  // For now, logout is handled client-side by removing the token
  // In production, you might want to implement token blacklisting
  res.json({ message: 'Logged out successfully' });
});

export default router;

