import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProjectForm from '../forms/ProjectForm';
import Badge from '../shared/Badge';
import ErrorMessage from '../shared/ErrorMessage';
import EmptyState from '../shared/EmptyState';
import UpdateProjectModal from '../modals/UpdateProjectModal';
import { formatDate } from '../../utils/format';

const ProjectsPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deletingProject, setDeletingProject] = useState('');
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [projectToUpdate, setProjectToUpdate] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const isViewer = user?.role === 'viewer';

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await api.getProjects(token);
      setProjects(payload.projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadProjects();
    }
  }, [token, loadProjects]);

  const handleCreate = async (payload) => {
    setFormLoading(true);
    setError('');
    try {
      const { project } = await api.createProject(payload, token);
      setProjects((prev) => [project, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setDeletingProject(id);
    setError('');
    try {
      await api.deleteProject(id, token);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingProject('');
    }
  };

  const handleOpenUpdateModal = (project) => {
    setProjectToUpdate(project);
    setUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setUpdateModalOpen(false);
    setProjectToUpdate(null);
  };

  const handleUpdateProject = async (updatedData) => {
    setUpdateLoading(true);
    setError('');
    try {
      const { project: updatedProject } = await api.updateProject(
        updatedData._id,
        updatedData,
        token,
      );
      setProjects((prev) => prev.map((p) => (p._id === updatedProject._id ? updatedProject : p)));
      handleCloseUpdateModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ErrorMessage message={error} />

      {!isViewer && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Create</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">New project</h2>
            <div className="mt-6">
              <ProjectForm onSubmit={handleCreate} isSubmitting={formLoading} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Insights</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Portfolio health</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Active</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  {projects.filter((project) => project.status !== 'Completed').length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">projects in motion</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Average progress</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  {projects.length
                    ? Math.round(
                        projects.reduce((acc, project) => acc + (project.progress || 0), 0) /
                          projects.length,
                      )
                    : 0}
                  %
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">completion across projects</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Manage</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Projects</h2>
          </div>
          <button
            type="button"
            onClick={loadProjects}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-200">
              <thead>
                <tr className="text-xs uppercase text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Timeline</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Tasks</th>
                  {!isViewer && <th className="px-4 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {projects.slice().reverse().map((project) => (
                  <tr key={project._id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{project.name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={project.status === 'Completed' ? 'success' : 'info'}>
                        {project.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(project.startDate)} → {formatDate(project.endDate)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {project.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                      <button
                        type="button"
                        onClick={() => navigate(`/tasks?project=${project._id}`)}
                        className="text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {(project.relatedTasks || []).length} linked
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      {!isViewer && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(project)}
                            className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-500/20 hover:text-indigo-900 dark:text-indigo-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingProject === project._id}
                            onClick={() => handleDelete(project._id)}
                            className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/20 hover:text-rose-700 dark:text-rose-100 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            {projects.slice().reverse().map((project) => (
              <div
                key={project._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">{project.name}</p>
                  </div>
                  <Badge variant={project.status === 'Completed' ? 'success' : 'info'}>{project.status}</Badge>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div>
                    <dt className="text-xs uppercase text-slate-400 dark:text-slate-500">Timeline</dt>
                    <dd className="mt-1">
                      {formatDate(project.startDate)} → {formatDate(project.endDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-400 dark:text-slate-500">Linked tasks</dt>
                    <dd className="mt-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/tasks?project=${project._id}`)}
                        className="text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {(project.relatedTasks || []).length} tasks
                      </button>
                    </dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <p className="text-xs uppercase text-slate-400 dark:text-slate-500">Progress</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{project.progress || 0}%</span>
                  </div>
                </div>

                {!isViewer && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleOpenUpdateModal(project)}
                      className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-500/20 hover:text-indigo-900 dark:text-indigo-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingProject === project._id}
                      onClick={() => handleDelete(project._id)}
                      className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/20 hover:text-rose-700 dark:text-rose-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!projects.length && !loading && (
            <div className="mt-6">
              <EmptyState description="Projects you create will populate this portfolio table." />
            </div>
          )}
        </div>
      </section>

      {/* Update Project Modal */}
      <UpdateProjectModal
        isOpen={updateModalOpen}
        onClose={handleCloseUpdateModal}
        project={projectToUpdate}
        onUpdate={handleUpdateProject}
        isLoading={updateLoading}
      />
    </div>
  );
};

export default ProjectsPage;
