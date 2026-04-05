import Project from '../models/project.js';
import Task from '../models/task.js';

export const createProject = async (projectData, ownerId) => {
  if (!ownerId) {
    throw new Error('Unauthorized');
  }

  return Project.create({
    ...projectData,
    owner: ownerId,
  });
};

export const getProjects = async (ownerId) => {
  if (!ownerId) {
    throw new Error('Unauthorized');
  }

  return Project.find({ owner: ownerId })
    .populate('assignedUsers', 'username email role')
    .populate({
      path: 'relatedTasks',
      match: { owner: ownerId },
    });
};

export const getProjectById = async (projectId, ownerId) => {
  if (!ownerId) {
    throw new Error('Unauthorized');
  }

  return Project.findOne({ _id: projectId, owner: ownerId })
    .populate('assignedUsers', 'username email role')
    .populate({
      path: 'relatedTasks',
      match: { owner: ownerId },
    });
};

export const updateProject = async (projectId, updates, ownerId) => {
  if (!ownerId) {
    throw new Error('Unauthorized');
  }

  const safeUpdates = { ...updates };
  delete safeUpdates.owner;
  delete safeUpdates.assignedUsers;
  delete safeUpdates.relatedTasks;

  return Project.findOneAndUpdate({ _id: projectId, owner: ownerId }, safeUpdates, {
    new: true,
    runValidators: true,
  });
};

export const deleteProject = async (projectId, ownerId) => {
  if (!ownerId) {
    throw new Error('Unauthorized');
  }

  await Task.deleteMany({ projectId, owner: ownerId });
  return Project.findOneAndDelete({ _id: projectId, owner: ownerId });
};
