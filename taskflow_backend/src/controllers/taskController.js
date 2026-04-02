import Task from '../models/task.js';
import Project from '../models/project.js';

export const createTask = async (req, res) => {
  try {
    if (!req.body.projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const task = await Task.create(req.body);

    await Project.findByIdAndUpdate(task.projectId, { $addToSet: { relatedTasks: task._id } });

    return res.status(201).json({ task });
  } catch (error) {
    console.error('createTask error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo', 'name email role')
      .populate('comments.author', 'name email');

    return res.json({ tasks });
  } catch (error) {
    console.error('getTasksByProject error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const task = await Task.findByIdAndUpdate(req.params.id, { status }, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json({ task });
  } catch (error) {
    console.error('updateTaskStatus error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};


export const updateTask = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.projectId;
    const task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
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
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Project.findByIdAndUpdate(task.projectId, { $pull: { relatedTasks: task._id } });

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('deleteTask error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};
