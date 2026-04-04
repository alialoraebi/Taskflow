import { describe, beforeEach, expect, jest } from '@jest/globals';

// Mock the service layer — controllers no longer call models directly
const mockTaskService = {
  createTask: jest.fn(),
  getTasksByProject: jest.fn(),
  updateTask: jest.fn(),
  updateTaskStatus: jest.fn(),
  deleteTask: jest.fn(),
};

jest.unstable_mockModule('../src/services/taskService.js', () => mockTaskService);

const {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  updateTask,
  deleteTask,
} = await import('../src/controllers/taskController.js');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('taskController.createTask', () => {
  it('creates task and returns 201', async () => {
    const req = { body: { projectId: 'p1', title: 'Task' } };
    const res = mockResponse();
    const task = { _id: 't1', projectId: 'p1', title: 'Task' };
    mockTaskService.createTask.mockResolvedValue(task);

    await createTask(req, res);

    expect(mockTaskService.createTask).toHaveBeenCalledWith({ projectId: 'p1', title: 'Task' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ task });
  });

  it('returns 400 when service throws (e.g. missing projectId)', async () => {
    const req = { body: { title: 'Task' } };
    const res = mockResponse();
    mockTaskService.createTask.mockRejectedValue(new Error('projectId is required'));

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId is required' });
  });
});

describe('taskController.getTasksByProject', () => {
  it('returns tasks for a project', async () => {
    const req = { params: { projectId: 'p1' }, query: {} };
    const res = mockResponse();
    const tasks = [{ id: 't1' }];
    mockTaskService.getTasksByProject.mockResolvedValue(tasks);

    await getTasksByProject(req, res);

    expect(mockTaskService.getTasksByProject).toHaveBeenCalledWith('p1', {});
    expect(res.json).toHaveBeenCalledWith({ tasks });
  });

  it('handles errors', async () => {
    const req = { params: { projectId: 'p1' }, query: {} };
    const res = mockResponse();
    mockTaskService.getTasksByProject.mockRejectedValue(new Error('failed'));

    await getTasksByProject(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'failed' });
  });
});

describe('taskController.updateTaskStatus', () => {
  it('returns 400 when service throws missing status error', async () => {
    const req = { params: { id: 't1' }, body: {} };
    const res = mockResponse();
    mockTaskService.updateTaskStatus.mockRejectedValue(new Error('Status is required'));

    await updateTaskStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Status is required' });
  });

  it('updates and returns task when found', async () => {
    const req = { params: { id: 't1' }, body: { status: 'In Progress' } };
    const res = mockResponse();
    const updated = { id: 't1', status: 'In Progress' };
    mockTaskService.updateTaskStatus.mockResolvedValue(updated);

    await updateTaskStatus(req, res);

    expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith('t1', 'In Progress');
    expect(res.json).toHaveBeenCalledWith({ task: updated });
  });

  it('returns 404 when task missing', async () => {
    const req = { params: { id: 'missing' }, body: { status: 'In Progress' } };
    const res = mockResponse();
    mockTaskService.updateTaskStatus.mockResolvedValue(null);

    await updateTaskStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
  });
});

describe('taskController.updateTask', () => {
  it('returns updated task', async () => {
    const req = { params: { id: 't1' }, body: { title: 'Updated' } };
    const res = mockResponse();
    const task = { id: 't1', title: 'Updated' };
    mockTaskService.updateTask.mockResolvedValue(task);

    await updateTask(req, res);

    expect(mockTaskService.updateTask).toHaveBeenCalledWith('t1', { title: 'Updated' });
    expect(res.json).toHaveBeenCalledWith({ task });
  });

  it('returns 404 when task missing', async () => {
    const req = { params: { id: 'missing' }, body: {} };
    const res = mockResponse();
    mockTaskService.updateTask.mockResolvedValue(null);

    await updateTask(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
  });
});

describe('taskController.deleteTask', () => {
  it('returns 404 when task missing', async () => {
    const req = { params: { id: 'missing' } };
    const res = mockResponse();
    mockTaskService.deleteTask.mockResolvedValue(null);

    await deleteTask(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
  });

  it('deletes task successfully', async () => {
    const req = { params: { id: 't1' } };
    const res = mockResponse();
    mockTaskService.deleteTask.mockResolvedValue({ _id: 't1' });

    await deleteTask(req, res);

    expect(mockTaskService.deleteTask).toHaveBeenCalledWith('t1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Task deleted successfully' });
  });
});
