import {
  createTask as createTaskService,
  getTasksByProject as getTasksByProjectService,
  updateTask as updateTaskService,
  updateTaskStatus as updateTaskStatusService,
  deleteTask as deleteTaskService,
} from '../services/taskService.js';

export const createTask = async (req, res) => {
  try {
    const task = await createTaskService(req.body);

    return res.status(201).json({ task });
  } catch (error) {
    console.error('createTask error:', error.message);
    return res.status(400).json({ message: error.message });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const tasks = await getTasksByProjectService(req.params.projectId, req.query);

    return res.json({ tasks });
  } catch (error) {
    console.error('getTasksByProject error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const task = await updateTaskStatusService(req.params.id, req.body.status);

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
    const task = await updateTaskService(req.params.id, req.body);
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
    const task = await deleteTaskService(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('deleteTask error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};
