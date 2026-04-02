import Project from '../models/project.js';
import Task from '../models/task.js';

export const createProject = async (projectData) => {
  return Project.create(projectData);
};

export const getProjects = async () => {
  return Project.find()
    .populate('assignedUsers', 'name email role')
    .populate('relatedTasks');
};

export const getProjectById = async (projectId) => {
  return Project.findById(projectId)
    .populate('assignedUsers', 'name email role')
    .populate('relatedTasks');
};

export const updateProject = async (projectId, updates) => {
  return Project.findByIdAndUpdate(projectId, updates, {
    new: true,
    runValidators: true,
  });
};

export const deleteProject = async (projectId) => {
  await Task.deleteMany({ projectId });
  return Project.findByIdAndDelete(projectId);
};
