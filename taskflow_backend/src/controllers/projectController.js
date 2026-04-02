import Project from '../models/project.js';
import Task from '../models/task.js';

export const createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    return res.status(201).json({ project });
  } catch (error) {
    console.error('createProject error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    console.log('📋 getProjects called by user:', req.user?.email || 'unknown');
    const projects = await Project.find()
      .populate('assignedUsers', 'name email role')
      .populate('relatedTasks');

    console.log(`✅ Found ${projects.length} projects`);
    return res.json({ projects });
  } catch (error) {
    console.error('❌ getProjects error:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('assignedUsers', 'name email role')
      .populate('relatedTasks');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.json({ project });
  } catch (error) {
    console.error('getProjectById error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.json({ project });
  } catch (error) {
    console.error('updateProject error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    // First, delete all tasks associated with this project
    await Task.deleteMany({ projectId: req.params.id });
    console.log(`🗑️ Deleted tasks associated with project ${req.params.id}`);

    // Then delete the project itself
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`🗑️ Deleted project ${req.params.id}`);
    return res.json({ message: 'Project and associated tasks deleted successfully' });
  } catch (error) {
    console.error('deleteProject error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};
