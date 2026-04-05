import Task from '../models/task.js';
import Project from '../models/project.js';
import TaskFactory from '../patterns/TaskFactory.js';
import {
  CreateTaskCommand,
  UpdateTaskCommand,
  UpdateTaskStatusCommand,
  DeleteTaskCommand,
} from '../patterns/TaskCommand.js';
import { buildTaskQuery } from '../patterns/TaskSpecification.js';

const ensureProjectOwnership = async (projectId, ownerId) => {
  if (!projectId || !ownerId) {
    return false;
  }

  const project = await Project.exists({ _id: projectId, owner: ownerId });
  return Boolean(project);
};

export const createTask = async (taskData, ownerId) => {
  if (!ownerId) {
    throw new Error('Unauthorized');
  }

  const projectOwned = await ensureProjectOwnership(taskData.projectId, ownerId);
  if (!projectOwned) {
    throw new Error('Project not found or access denied');
  }

  // Factory pattern centralizes task construction and normalization.
  const taskPayload = TaskFactory.create({ ...taskData, owner: ownerId });
  // Command pattern encapsulates the task creation mutation.
  const command = new CreateTaskCommand(taskPayload);
  return command.execute();
};

export const getTasksByProject = async (projectId, filters = {}, ownerId) => {
  if (!ownerId) {
    throw new Error('Unauthorized');
  }

  const projectOwned = await ensureProjectOwnership(projectId, ownerId);
  if (!projectOwned) {
    return [];
  }

  // Specification pattern composes reusable task filters into a query.
  const query = buildTaskQuery({
    projectId,
    status: filters.status,
    priority: filters.priority,
    dueBefore: filters.dueBefore,
    dueAfter: filters.dueAfter,
  });

  query.owner = ownerId;

  return Task.find(query)
    .populate('assignedTo', 'username email role')
    .populate('comments.author', 'username email');
};

export const updateTask = async (taskId, updates, ownerId) => {
  if (!ownerId) {
    throw new Error('Unauthorized');
  }

  const task = await Task.findOne({ _id: taskId, owner: ownerId });
  if (!task) {
    return null;
  }

  const sanitizedUpdates = { ...updates };
  delete sanitizedUpdates.projectId;
  delete sanitizedUpdates.owner;

  const command = new UpdateTaskCommand(taskId, sanitizedUpdates);
  return command.execute();
};

export const updateTaskStatus = async (taskId, status, ownerId) => {
  if (!ownerId) {
    throw new Error('Unauthorized');
  }

  if (!status) {
    throw new Error('Status is required');
  }

  const task = await Task.findOne({ _id: taskId, owner: ownerId });
  if (!task) {
    return null;
  }

  const command = new UpdateTaskStatusCommand(taskId, status);
  return command.execute();
};

export const deleteTask = async (taskId, ownerId) => {
  if (!ownerId) {
    throw new Error('Unauthorized');
  }

  const task = await Task.findOne({ _id: taskId, owner: ownerId });
  if (!task) {
    return null;
  }

  const command = new DeleteTaskCommand(taskId);
  return command.execute();
};

export const ensureProjectExists = async (projectId, ownerId) => {
  return Project.exists({ _id: projectId, owner: ownerId });
};
