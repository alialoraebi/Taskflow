import Task from '../models/task.js';
import Project from '../models/project.js';

class TaskCommand {
  async execute() {
    throw new Error('execute() must be implemented by subclasses');
  }
}

class CreateTaskCommand extends TaskCommand {
  constructor(taskPayload) {
    super();
    this.taskPayload = taskPayload;
  }

  async execute() {
    const task = await Task.create(this.taskPayload);
    await Project.findByIdAndUpdate(task.projectId, {
      $addToSet: { relatedTasks: task._id },
    });
    return task;
  }
}

class UpdateTaskCommand extends TaskCommand {
  constructor(taskId, updates) {
    super();
    this.taskId = taskId;
    this.updates = updates;
  }

  async execute() {
    return Task.findByIdAndUpdate(this.taskId, this.updates, {
      new: true,
      runValidators: true,
    });
  }
}

class UpdateTaskStatusCommand extends TaskCommand {
  constructor(taskId, status) {
    super();
    this.taskId = taskId;
    this.status = status;
  }

  async execute() {
    return Task.findByIdAndUpdate(this.taskId, { status: this.status }, {
      new: true,
      runValidators: true,
    });
  }
}

class DeleteTaskCommand extends TaskCommand {
  constructor(taskId) {
    super();
    this.taskId = taskId;
  }

  async execute() {
    const task = await Task.findByIdAndDelete(this.taskId);

    if (task) {
      await Project.findByIdAndUpdate(task.projectId, {
        $pull: { relatedTasks: task._id },
      });
    }

    return task;
  }
}

export {
  TaskCommand,
  CreateTaskCommand,
  UpdateTaskCommand,
  UpdateTaskStatusCommand,
  DeleteTaskCommand,
};
