import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { authMiddleware, blockViewer } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', blockViewer, createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', blockViewer, updateProject);
router.delete('/:id', blockViewer, deleteProject);

export default router;
