import {
  createTask as createTaskService,
  getTasksByProject as getTasksByProjectService,
  updateTask as updateTaskService,
  updateTaskStatus as updateTaskStatusService,
  deleteTask as deleteTaskService,
} from '../services/taskService.js';

export const createTask = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const task = await createTaskService(req.body, req.user.id);

    return res.status(201).json({ task });
  } catch (error) {
    console.error('createTask error:', error.message);
    return res.status(400).json({ message: error.message });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projectId = req.params.projectId || req.query.project;
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const tasks = await getTasksByProjectService(projectId, req.query, req.user.id);

    return res.json({ tasks });
  } catch (error) {
    console.error('getTasksByProject error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const task = await updateTaskStatusService(req.params.id, req.body.status, req.user.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json({ task });
  } catch (error) {
    console.error('updateTaskStatus error:', error.message);
    return res.status(400).json({ message: error.message });
  }
};


export const updateTask = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const task = await updateTaskService(req.params.id, req.body, req.user.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.json({ task });
  } catch (error) {
    console.error('updateTask error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};
export const deleteTask = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const task = await deleteTaskService(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('deleteTask error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};
