import { Router } from 'express';
import { registerUser, loginUser, getAllUsers, deleteUser, updateUser, updateCurrentUser } from '../controllers/userController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/me', authMiddleware, updateCurrentUser);
router.get('/', authMiddleware, requireRole('admin', 'staff'), getAllUsers);
router.put('/:id', authMiddleware, requireRole('admin', 'staff'), updateUser);
router.delete('/:id', authMiddleware, requireRole('admin', 'staff'), deleteUser);

export default router;
