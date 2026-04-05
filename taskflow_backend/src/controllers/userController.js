import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { normalizeHolidayCountry } from '../utils/holidayApi.js';

const signToken = (userId, role) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }

  return jwt.sign({ sub: userId, role }, secret, { expiresIn });
};

export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, role, holidayRegion } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: typeof name === 'string' ? name.trim() : '',
      username,
      email,
      password: hashedPassword,
      holidayRegion: normalizeHolidayCountry(holidayRegion),
      role,
    });

    const token = signToken(user.id, user.role);

    return res.status(201).json({ user, token });
  } catch (error) {
    console.error('registerUser error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user.id, user.role);

    return res.json({ user: user.toJSON(), token });
  } catch (error) {
    console.error('loginUser error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    console.log('👥 getAllUsers called by user:', req.user?.email || 'unknown');
    const users = await User.find();
    console.log(`✅ Found ${users.length} users`);
    return res.json({ users });
  } catch (error) {
    console.error('❌ getAllUsers error:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ message: error.message });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const nextName = typeof req.body.name === 'string' ? req.body.name.trim() : undefined;
    const nextUsername = typeof req.body.username === 'string' ? req.body.username.trim() : undefined;
    const nextEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : undefined;
    const nextHolidayRegion = req.body.holidayRegion !== undefined ? normalizeHolidayCountry(req.body.holidayRegion) : undefined;
    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body.newPassword === 'string'
      ? req.body.newPassword
      : typeof req.body.password === 'string'
        ? req.body.password
        : undefined;

    if (nextName !== undefined) {
      user.name = nextName;
    }

    if (nextUsername !== undefined) {
      if (!nextUsername) {
        return res.status(400).json({ message: 'Username is required' });
      }

      const existingUsername = await User.findOne({
        username: nextUsername,
        _id: { $ne: user._id },
      });

      if (existingUsername) {
        return res.status(409).json({ message: 'User with this username already exists' });
      }

      user.username = nextUsername;
    }

    if (nextEmail !== undefined) {
      if (!nextEmail) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const existingEmail = await User.findOne({
        email: nextEmail,
        _id: { $ne: user._id },
      });

      if (existingEmail) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      user.email = nextEmail;
    }

    if (nextHolidayRegion !== undefined) {
      user.holidayRegion = nextHolidayRegion;
    }

    if (newPassword !== undefined) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    return res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('updateCurrentUser error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.user?.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('updateUser error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};
