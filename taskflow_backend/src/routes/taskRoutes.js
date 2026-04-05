import { Router } from 'express';
import {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { authMiddleware, blockViewer } from '../middleware/authMiddleware.js';
const router = Router();

router.use(authMiddleware);

router.post('/', blockViewer, createTask);
router.get('/', getTasksByProject);
router.get('/project/:projectId', getTasksByProject);
router.put('/:id', blockViewer, updateTask);
router.patch('/:id/status', blockViewer, updateTaskStatus);
router.patch('/:id', blockViewer, updateTaskStatus);
router.delete('/:id', blockViewer, deleteTask);

export default router;
