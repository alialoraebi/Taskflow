import { describe, beforeEach, expect, jest } from '@jest/globals';

// Mock the service layer — controllers no longer call models directly
const mockProjectService = {
  createProject: jest.fn(),
  getProjects: jest.fn(),
  getProjectById: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
};

jest.unstable_mockModule('../src/services/projectService.js', () => mockProjectService);

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = await import('../src/controllers/projectController.js');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

describe('projectController.createProject', () => {
  it('returns 201 with created project', async () => {
    const req = { body: { name: 'Project A' } };
    const res = mockResponse();
    const project = { id: 'p1', name: 'Project A' };
    mockProjectService.createProject.mockResolvedValue(project);

    await createProject(req, res);

    expect(mockProjectService.createProject).toHaveBeenCalledWith({ name: 'Project A' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ project });
  });

  it('handles errors gracefully', async () => {
    const req = { body: {} };
    const res = mockResponse();
    mockProjectService.createProject.mockRejectedValue(new Error('failed'));

    await createProject(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'failed' });
  });
});

describe('projectController.getProjects', () => {
  it('returns all projects', async () => {
    const req = {};
    const res = mockResponse();
    const projects = [{ id: 'p1' }];
    mockProjectService.getProjects.mockResolvedValue(projects);

    await getProjects(req, res);

    expect(mockProjectService.getProjects).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ projects });
  });

  it('handles errors', async () => {
    const req = {};
    const res = mockResponse();
    mockProjectService.getProjects.mockRejectedValue(new Error('failed'));

    await getProjects(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'failed' });
  });
});

describe('projectController.getProjectById', () => {
  it('returns project when found', async () => {
    const req = { params: { id: 'p1' } };
    const res = mockResponse();
    const project = { id: 'p1' };
    mockProjectService.getProjectById.mockResolvedValue(project);

    await getProjectById(req, res);

    expect(mockProjectService.getProjectById).toHaveBeenCalledWith('p1');
    expect(res.json).toHaveBeenCalledWith({ project });
  });

  it('returns 404 when missing', async () => {
    const req = { params: { id: 'missing' } };
    const res = mockResponse();
    mockProjectService.getProjectById.mockResolvedValue(null);

    await getProjectById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
  });
});

describe('projectController.updateProject', () => {
  it('returns updated project when found', async () => {
    const req = { params: { id: 'p1' }, body: { name: 'Updated' } };
    const res = mockResponse();
    const project = { id: 'p1', name: 'Updated' };
    mockProjectService.updateProject.mockResolvedValue(project);

    await updateProject(req, res);

    expect(mockProjectService.updateProject).toHaveBeenCalledWith('p1', { name: 'Updated' });
    expect(res.json).toHaveBeenCalledWith({ project });
  });

  it('returns 404 when project missing', async () => {
    const req = { params: { id: 'missing' }, body: {} };
    const res = mockResponse();
    mockProjectService.updateProject.mockResolvedValue(null);

    await updateProject(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
  });
});

describe('projectController.deleteProject', () => {
  it('deletes project successfully', async () => {
    const req = { params: { id: 'p1' } };
    const res = mockResponse();
    mockProjectService.deleteProject.mockResolvedValue({ id: 'p1' });

    await deleteProject(req, res);

    expect(mockProjectService.deleteProject).toHaveBeenCalledWith('p1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Project and associated tasks deleted successfully' });
  });

  it('returns 404 when project not found', async () => {
    const req = { params: { id: 'missing' } };
    const res = mockResponse();
    mockProjectService.deleteProject.mockResolvedValue(null);

    await deleteProject(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
  });
});
