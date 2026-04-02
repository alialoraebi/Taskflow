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

export const createTask = async (taskData) => {
  const taskPayload = TaskFactory.create(taskData);
  const command = new CreateTaskCommand(taskPayload);
  return command.execute();
};

export const getTasksByProject = async (projectId, filters = {}) => {
  const query = buildTaskQuery({
    projectId,
    status: filters.status,
    priority: filters.priority,
    dueBefore: filters.dueBefore,
    dueAfter: filters.dueAfter,
  });

  return Task.find(query)
    .populate('assignedTo', 'name email role')
    .populate('comments.author', 'name email');
};

export const updateTask = async (taskId, updates) => {
  const sanitizedUpdates = { ...updates };
  delete sanitizedUpdates.projectId;

  const command = new UpdateTaskCommand(taskId, sanitizedUpdates);
  return command.execute();
};

export const updateTaskStatus = async (taskId, status) => {
  if (!status) {
    throw new Error('Status is required');
  }

  const command = new UpdateTaskStatusCommand(taskId, status);
  return command.execute();
};

export const deleteTask = async (taskId) => {
  const command = new DeleteTaskCommand(taskId);
  return command.execute();
};

export const ensureProjectExists = async (projectId) => {
  return Project.exists({ _id: projectId });
};
