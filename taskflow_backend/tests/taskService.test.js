import { describe, beforeEach, expect, jest } from '@jest/globals';

// Mock models and pattern dependencies used by taskService
const mockTaskModel = {
  create: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  exists: jest.fn(),
};

const mockProjectModel = {
  findByIdAndUpdate: jest.fn(),
  exists: jest.fn(),
};

jest.unstable_mockModule('../src/models/task.js', () => ({
  default: mockTaskModel,
}));

jest.unstable_mockModule('../src/models/project.js', () => ({
  default: mockProjectModel,
}));

const {
  createTask,
  getTasksByProject,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = await import('../src/services/taskService.js');

const makePopulateChain = (resultPromise) => {
  const chain = {};
  chain.populate = jest.fn().mockReturnValue(chain);
  chain.then = resultPromise.then.bind(resultPromise);
  chain.catch = resultPromise.catch.bind(resultPromise);
  return chain;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('taskService.createTask', () => {
  it('normalizes input via TaskFactory and creates task via command', async () => {
    const task = { _id: 't1', projectId: 'p1', title: 'Fix bug' };
    mockTaskModel.create.mockResolvedValue(task);
    mockProjectModel.findByIdAndUpdate.mockResolvedValue({});

    const result = await createTask({ projectId: 'p1', title: '  Fix bug  ' });

    expect(mockTaskModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'p1', title: 'Fix bug' }),
    );
    expect(mockProjectModel.findByIdAndUpdate).toHaveBeenCalledWith('p1', {
      $addToSet: { relatedTasks: 't1' },
    });
    expect(result).toEqual(task);
  });

  it('throws when projectId is missing', async () => {
    await expect(createTask({ title: 'No project' })).rejects.toThrow('projectId is required');
  });

  it('throws when title is missing', async () => {
    await expect(createTask({ projectId: 'p1' })).rejects.toThrow('title is required');
  });

  it('sets default status and priority when not provided', async () => {
    const task = { _id: 't1', projectId: 'p1', title: 'Task' };
    mockTaskModel.create.mockResolvedValue(task);
    mockProjectModel.findByIdAndUpdate.mockResolvedValue({});

    await createTask({ projectId: 'p1', title: 'Task' });

    expect(mockTaskModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Todo', priority: 'Medium' }),
    );
  });
});

describe('taskService.getTasksByProject', () => {
  it('queries tasks by projectId using specification', async () => {
    const tasks = [{ id: 't1' }];
    const chain = makePopulateChain(Promise.resolve(tasks));
    mockTaskModel.find.mockReturnValue(chain);

    const result = await getTasksByProject('p1');

    expect(mockTaskModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'p1' }),
    );
    expect(result).toEqual(tasks);
  });

  it('applies status filter when provided', async () => {
    const tasks = [];
    const chain = makePopulateChain(Promise.resolve(tasks));
    mockTaskModel.find.mockReturnValue(chain);

    await getTasksByProject('p1', { status: 'Completed' });

    const calledQuery = mockTaskModel.find.mock.calls[0][0];
    expect(JSON.stringify(calledQuery)).toContain('Completed');
  });
});

describe('taskService.updateTaskStatus', () => {
  it('throws when status is missing', async () => {
    await expect(updateTaskStatus('t1', '')).rejects.toThrow('Status is required');
  });

  it('updates task status via command', async () => {
    const updated = { id: 't1', status: 'Completed' };
    mockTaskModel.findByIdAndUpdate.mockResolvedValue(updated);

    const result = await updateTaskStatus('t1', 'Completed');

    expect(mockTaskModel.findByIdAndUpdate).toHaveBeenCalledWith(
      't1',
      { status: 'Completed' },
      { new: true, runValidators: true },
    );
    expect(result).toEqual(updated);
  });
});

describe('taskService.updateTask', () => {
  it('strips projectId from updates and delegates to command', async () => {
    const updated = { id: 't1', title: 'New title' };
    mockTaskModel.findByIdAndUpdate.mockResolvedValue(updated);

    await updateTask('t1', { title: 'New title', projectId: 'should-be-removed' });

    const calledUpdates = mockTaskModel.findByIdAndUpdate.mock.calls[0][1];
    expect(calledUpdates).not.toHaveProperty('projectId');
    expect(calledUpdates).toHaveProperty('title', 'New title');
  });
});

describe('taskService.deleteTask', () => {
  it('deletes task and removes from project via command', async () => {
    const deleted = { _id: 't1', projectId: 'p1' };
    mockTaskModel.findByIdAndDelete.mockResolvedValue(deleted);
    mockProjectModel.findByIdAndUpdate.mockResolvedValue({});

    const result = await deleteTask('t1');

    expect(mockTaskModel.findByIdAndDelete).toHaveBeenCalledWith('t1');
    expect(mockProjectModel.findByIdAndUpdate).toHaveBeenCalledWith('p1', {
      $pull: { relatedTasks: 't1' },
    });
    expect(result).toEqual(deleted);
  });

  it('returns null when task not found', async () => {
    mockTaskModel.findByIdAndDelete.mockResolvedValue(null);

    const result = await deleteTask('missing');

    expect(result).toBeNull();
    expect(mockProjectModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
