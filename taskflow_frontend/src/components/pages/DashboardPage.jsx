import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../cards/StatCard';
import Badge from '../shared/Badge';
import EmptyState from '../shared/EmptyState';
import ErrorMessage from '../shared/ErrorMessage';
import { formatDate } from '../../utils/format';
import TimelineCalendar from '../dashboard/TimelineCalendar';
import ViewProjectModal from '../modals/ViewProjectModal';
import UpdateProjectModal from '../modals/UpdateProjectModal';

const DashboardPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const tasksPerPage = 5;
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        console.log('🔄 Fetching dashboard data with token:', token ? 'exists' : 'missing');

        const projectsPayload = await api.getProjects(token);

        console.log('✅ Dashboard data loaded:', {
          projects: projectsPayload.projects?.length,
        });

        if (!cancelled) {
          setProjects(projectsPayload.projects || []);
        }
      } catch (err) {
        console.error('❌ Dashboard load error:', err);
        console.error('Error message:', err.message);
        console.error('Token being used:', token ? token.substring(0, 20) + '...' : 'none');
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (token) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [token, isViewer]);

  const tasks = useMemo(
    () =>
      projects
        .flatMap((project) =>
          (project.relatedTasks || []).map((task) => ({
            ...task,
            projectName: project.name,
            projectId: task.projectId || project._id,
          })),
        )
        .sort((a, b) => {
          // Sort by due date (most recent first)
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : -Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : -Infinity;
          return dateB - dateA;
        }),
    [projects],
  );

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks
      .filter((task) => {
        if (String(task.status || '').toLowerCase() === 'completed') {
          return false;
        }

        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        if (!dueDate || Number.isNaN(dueDate.getTime())) {
          return false;
        }

        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      })
      .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate));
  }, [tasks]);

  const totalTaskPages = Math.ceil(tasks.length / tasksPerPage);
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentTaskPage - 1) * tasksPerPage;
    return tasks.slice(startIndex, startIndex + tasksPerPage);
  }, [tasks, currentTaskPage]);

  const stats = [
    {
      label: 'Projects',
      value: projects.length,
      helper: `${projects.filter((project) => project.status === 'In Progress').length} active`,
      accent: 'purple',
    },
    {
      label: 'Tasks',
      value: tasks.length,
      helper: `${tasks.filter((task) => task.status !== 'Completed').length} pending`,
      accent: 'emerald',
    },
    {
      label: 'Overdue',
      value: overdueTasks.length,
      helper: overdueTasks.length ? 'Requires attention' : 'No late tasks',
      accent: 'rose',
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
      </div>
    );
  }

  const handleUpdateProject = async (updatedData) => {
    try {
      setError('');
      const { project: updatedProject } = await api.updateProject(
        updatedData._id,
        updatedData,
        token,
      );
      setProjects((prev) => prev.map(p => p._id === updatedProject._id ? updatedProject : p));
      setEditModalOpen(false);
      setSelectedProject(updatedProject);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <ErrorMessage message={error} />

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section>
        <TimelineCalendar projects={projects} tasks={tasks} token={token} isViewer={isViewer} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Tasks</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Overdue tasks</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{overdueTasks.length} total</span>
        </div>

        <div className="mt-6 space-y-3">
          {overdueTasks.slice(0, 5).map((task) => (
            <div
              key={`overdue-${task._id}`}
              className="rounded-2xl border border-rose-200 bg-rose-50 p-4 transition hover:bg-rose-100/70 dark:border-rose-500/30 dark:bg-rose-500/10 dark:hover:bg-rose-500/15"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{task.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{task.projectName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/tasks', { state: { projectId: task.projectId, taskId: task._id } })}
                  className="rounded-full border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-white/70 dark:border-rose-400/40 dark:text-rose-100 dark:hover:bg-rose-500/10"
                >
                  View task
                </button>
              </div>
              <p className="mt-2 text-xs text-rose-700 dark:text-rose-200">
                Due {formatDate(task.dueDate)} · Status {task.status}
              </p>
            </div>
          ))}

          {!overdueTasks.length && (
            <EmptyState description="No overdue tasks right now." />
          )}
        </div>
      </section>

      <section>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Projects</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Delivery timeline</h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{projects.length} total</span>
            </div>

            <div className="mt-6 space-y-4">
              {projects.slice().reverse().slice(0, 5).map((project) => (
                <div
                  key={project._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                  onClick={() => { setSelectedProject(project); setViewModalOpen(true); }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View project ${project.name}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{project.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(project.startDate)} → {formatDate(project.endDate)}
                      </p>
                    </div>
                    <Badge variant={project.status === 'Completed' ? 'success' : 'info'}>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {project.progress || 0}% complete
                  </p>
                </div>
              ))}

              {!projects.length && (
                <EmptyState description="Create your first project to populate the delivery cadence." />
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Tasks</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Execution board</h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{tasks.length} total</span>
            </div>
            <div className="mt-6 space-y-3">
              {paginatedTasks.map((task) => {
                // Determine badge variant based on task status
                const getTaskStatusVariant = (status) => {
                  const statusLower = status?.toLowerCase() || '';
                  if (statusLower === 'completed') return 'success';
                  if (statusLower === 'blocked') return 'danger';
                  if (statusLower === 'in progress') return 'info';
                  if (statusLower === 'pending' || statusLower === 'todo' ) return 'warning';
                  return 'default';
                };

                return (
                  <div
                    key={task._id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                    onClick={() => navigate('/tasks', { state: { projectId: task.projectId, taskId: task._id } })}
                    tabIndex={0}
                    role="button"
                    aria-label={`Go to task ${task.title}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{task.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{task.projectName}</p>
                      </div>
                      <Badge variant={getTaskStatusVariant(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Due {formatDate(task.dueDate)} · Priority {task.priority}
                    </p>
                  </div>
                );
              })}
              {!tasks.length && (
                <EmptyState description="Link tasks to projects to see their execution state here." />
              )}
            </div>
            {totalTaskPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentTaskPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentTaskPage === 1}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Page {currentTaskPage} of {totalTaskPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentTaskPage((prev) => Math.min(totalTaskPages, prev + 1))}
                  disabled={currentTaskPage === totalTaskPages}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>


      </section>

      <ViewProjectModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        project={selectedProject}
        onEdit={() => { setViewModalOpen(false); setEditModalOpen(true); }}
      />
      <UpdateProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={selectedProject}
        onUpdate={handleUpdateProject}
        isLoading={false}
      />
    </div>
  );
};

export default DashboardPage;
