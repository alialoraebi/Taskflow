const DEFAULT_STATUS = 'Todo';
const DEFAULT_PRIORITY = 'Medium';

const normalizeString = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeDate = (value) => {
  if (!value) {
    return undefined;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const normalizeComments = (comments) => {
  if (!Array.isArray(comments)) {
    return [];
  }

  return comments
    .filter((comment) => comment && comment.message)
    .map((comment) => ({
      message: String(comment.message).trim(),
      author: comment.author,
      createdAt: comment.createdAt || new Date(),
    }));
};

const normalizeAttachments = (attachments) => {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .map((attachment) => normalizeString(attachment))
    .filter(Boolean);
};

class TaskFactory {
  static create(taskData = {}) {
    if (!taskData.projectId) {
      throw new Error('projectId is required');
    }

    const title = normalizeString(taskData.title);
    if (!title) {
      throw new Error('title is required');
    }

    return {
      owner: taskData.owner,
      projectId: taskData.projectId,
      title,
      description: normalizeString(taskData.description),
      assignedTo: taskData.assignedTo || undefined,
      status: taskData.status || DEFAULT_STATUS,
      priority: taskData.priority || DEFAULT_PRIORITY,
      dueDate: normalizeDate(taskData.dueDate),
      comments: normalizeComments(taskData.comments),
      attachments: normalizeAttachments(taskData.attachments),
    };
  }

  static createTodoTask(taskData = {}) {
    return TaskFactory.create({
      ...taskData,
      status: 'Todo',
    });
  }

  static createBlockedTask(taskData = {}) {
    return TaskFactory.create({
      ...taskData,
      status: 'Blocked',
    });
  }
}

export { TaskFactory };
export default TaskFactory;
