import jwt from 'jsonwebtoken';
import User from '../models/user.js';


export const authMiddleware = async (req, res, next) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is undefined');
      return res.status(500).json({ message: 'JWT configuration missing' });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
    };
    
    return next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default authMiddleware;

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
  
  next();
};

export const blockViewer = (req, res, next) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ message: 'Forbidden: viewers cannot modify data' });
  }
  next();
};
