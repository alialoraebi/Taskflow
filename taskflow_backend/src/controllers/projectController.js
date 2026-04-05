import {
  createProject as createProjectService,
  getProjects as getProjectsService,
  getProjectById as getProjectByIdService,
  updateProject as updateProjectService,
  deleteProject as deleteProjectService,
} from '../services/projectService.js';

export const createProject = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const project = await createProjectService(req.body, req.user.id);
    return res.status(201).json({ project });
  } catch (error) {
    console.error('createProject error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('📋 getProjects called by user:', req.user?.email || 'unknown');
    const projects = await getProjectsService(req.user.id);

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
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const project = await getProjectByIdService(req.params.id, req.user.id);

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
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const project = await updateProjectService(req.params.id, req.body, req.user.id);

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
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const project = await deleteProjectService(req.params.id, req.user.id);

    console.log(`🗑️ Deleted tasks associated with project ${req.params.id}`);

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
