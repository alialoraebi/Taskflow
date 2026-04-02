import { Router } from 'express';
import {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
const router = Router();

router.post('/', createTask);
router.get('/project/:projectId', getTasksByProject);
router.put('/:id', updateTask);
router.patch('/:id', updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;
