import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TaskForm from '../forms/TaskForm';
import UpdateTaskModal from '../modals/UpdateTaskModal';
import ErrorMessage from '../shared/ErrorMessage';
import EmptyState from '../shared/EmptyState';
import Badge from '../shared/Badge';
import { formatDate } from '../../utils/format';

const columns = ['Todo', 'In Progress', 'Review', 'Completed', 'Cancelled'];

const TasksPage = () => {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState('');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [draggingTask, setDraggingTask] = useState(null);
  const [touchDropTargetStatus, setTouchDropTargetStatus] = useState(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);

  const touchTimerRef = useRef(null);
  const touchStartRef = useRef(null);
  const autoScrollRef = useRef({ rafId: null, direction: 0 });

  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const payload = await api.getProjects(token);
        const projectList = payload.projects || [];
        setProjects(projectList);

        // Check for projectId in navigation state, then query param
        const navProjectId = location.state?.projectId;
        const projectParam = searchParams.get('project');
        if (navProjectId) {
          setSelectedProject(navProjectId);
        } else if (projectParam) {
          setSelectedProject(projectParam);
        } else {
          setSelectedProject('');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setInitialLoading(false);
      }
    };

    if (token) {
      loadProjects();
    }
  }, [token, searchParams, location.state]);

  useEffect(() => {
    const loadTasks = async () => {
      if (!selectedProject) {
        setTasks([]);
        return;
      }

      setTasksLoading(true);
      setError('');

      try {
        const payload = await api.getTasksByProject(selectedProject, token);
        setTasks(payload.tasks || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setTasksLoading(false);
      }
    };

    loadTasks();
  }, [selectedProject, token]);

  useEffect(
    () =>
      () => {
        if (touchTimerRef.current) {
          clearTimeout(touchTimerRef.current);
          touchTimerRef.current = null;
        }
        if (autoScrollRef.current.rafId) {
          cancelAnimationFrame(autoScrollRef.current.rafId);
          autoScrollRef.current.rafId = null;
          autoScrollRef.current.direction = 0;
        }
      },
    [],
  );

  const handleCreateTask = async (payload) => {
    if (!selectedProject) {
      setError('Select a project to attach the task to.');
      return;
    }

    setFormLoading(true);
    setError('');

    try {
      const { task } = await api.createTask(
        {
          ...payload,
          projectId: selectedProject,
        },
        token,
      );
      setTasks((prev) => [task, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const groupedTasks = useMemo(
    () =>
      columns.map((status) => ({
        status,
        items: tasks
          .filter((task) => task.status === status)
          .sort((a, b) => {
            // Sort by due date (latest first)
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : -Infinity;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : -Infinity;
            return dateB - dateA;
          }),
      })),
    [tasks],
  );

  const handleEditTask = async (payload) => {
    if (!editingTask) return;
    setFormLoading(true);
    setError('');
    try {
      const { task } = await api.updateTask(
        editingTask._id,
        { ...payload, projectId: selectedProject },
        token,
      );
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
      setEditingTask(null);
      setIsUpdateModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsUpdateModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
    setIsUpdateModalOpen(false);
  };

  const handleDragStart = (e, task) => {
    setDraggingTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task._id);
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const updateTaskStatus = async (task, newStatus) => {
    if (!task || !newStatus || task.status === newStatus) {
      return;
    }

    setFormLoading(true);
    setError('');
    try {
      const { task: updatedTask } = await api.updateTask(
        task._id,
        { ...task, status: newStatus, projectId: selectedProject },
        token,
      );
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggingTask) {
      return;
    }

    await updateTaskStatus(draggingTask, newStatus);
    setDraggingTask(null);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current.rafId) {
      cancelAnimationFrame(autoScrollRef.current.rafId);
      autoScrollRef.current.rafId = null;
    }
    autoScrollRef.current.direction = 0;
  };

  const startAutoScroll = (direction) => {
    if (autoScrollRef.current.direction === direction) return;
    stopAutoScroll();

    if (direction === 0) return;
    autoScrollRef.current.direction = direction;

    const step = () => {
      window.scrollBy({ top: direction * 14, left: 0, behavior: 'auto' });
      autoScrollRef.current.rafId = requestAnimationFrame(step);
    };

    autoScrollRef.current.rafId = requestAnimationFrame(step);
  };

  const handleTouchStart = (event, task) => {
    if (isViewer) return;
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }

    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    touchTimerRef.current = setTimeout(() => {
      setDraggingTask(task);
      setTouchDropTargetStatus(task.status);
      setIsTouchDragging(true);
      if (window.navigator.vibrate) {
        window.navigator.vibrate(40);
      }
    }, 450);
  };

  const handleTouchMove = (event) => {
    if (isViewer) return;
    const touch = event.touches[0];

    if (!draggingTask) {
      if (touchStartRef.current) {
        const dx = Math.abs(touch.clientX - touchStartRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartRef.current.y);
        if (dx > 8 || dy > 8) {
          if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
          }
          touchStartRef.current = null;
        }
      }
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const columnElement = element?.closest('[data-kanban-column]');
    if (columnElement) {
      setTouchDropTargetStatus(columnElement.getAttribute('data-kanban-column'));
    }

    const edgeThreshold = 80;
    if (touch.clientY < edgeThreshold) {
      startAutoScroll(-1);
    } else if (touch.clientY > window.innerHeight - edgeThreshold) {
      startAutoScroll(1);
    } else {
      startAutoScroll(0);
    }
  };

  const handleTouchEnd = async (event) => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    stopAutoScroll();

    if (!draggingTask) {
      touchStartRef.current = null;
      setIsTouchDragging(false);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    await updateTaskStatus(draggingTask, touchDropTargetStatus);
    setDraggingTask(null);
    setTouchDropTargetStatus(null);
    touchStartRef.current = null;
    setIsTouchDragging(false);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setDeletingTask(taskId);
    setError('');
    try {
      await api.deleteTask(taskId, token);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingTask('');
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ErrorMessage message={error} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Project</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Select workspace</h2>
          </div>
          <select
            value={selectedProject}
            onChange={(event) => setSelectedProject(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white pr-8 pl-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 sm:w-auto"
          >
            <option value="">Choose a project...</option>
            {projects.map((project) => (
              <option value={project._id} key={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {!isViewer && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Add task</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Detail the next action</h3>
              <div className="mt-4">
                <TaskForm onSubmit={handleCreateTask} disabled={formLoading} />
              </div>
            </div>
          )}

          <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/60 ${isViewer ? 'lg:col-span-2' : ''}`}>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Summary</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Execution load</h3>
            <div className="mt-4 space-y-4">
              {columns.map((column) => (
                <div key={column} className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-300">{column}</p>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {tasks.filter((task) => task.status === column).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Tasks</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Kanban board</h2>
          </div>
          {tasksLoading && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
          )}
        </div>

        {selectedProject ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {groupedTasks.map((column) => (
              <div
                key={column.status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
                data-kanban-column={column.status}
                className={`rounded-2xl border p-4 transition-colors ${
                  (draggingTask && touchDropTargetStatus === column.status) ||
                  (draggingTask && !touchDropTargetStatus && draggingTask.status !== column.status)
                    ? 'border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-500/10'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{column.status}</p>
                  <Badge variant="info">{column.items.length}</Badge>
                </div>

                <div className="mt-4 space-y-3 min-h-[100px]">
                  {column.items.length > 0 ? (
                    column.items.map((task) => (
                      <div
                        key={task._id}
                        draggable={!isViewer}
                        onDragStart={!isViewer ? (e) => handleDragStart(e, task) : undefined}
                        onDragEnd={!isViewer ? handleDragEnd : undefined}
                        onTouchStart={!isViewer ? (event) => handleTouchStart(event, task) : undefined}
                        onTouchMove={!isViewer ? handleTouchMove : undefined}
                        onTouchEnd={!isViewer ? handleTouchEnd : undefined}
                        onTouchCancel={!isViewer ? handleTouchEnd : undefined}
                        className={`select-none rounded-2xl border border-slate-200 bg-white/80 p-3 transition-all dark:border-slate-700 dark:bg-slate-800/80 ${
                          !isViewer && draggingTask?._id === task._id
                            ? 'cursor-grabbing opacity-50'
                            : !isViewer
                            ? 'cursor-grab hover:shadow-md'
                            : 'hover:shadow-md'
                        } ${isTouchDragging && draggingTask?._id === task._id ? 'ring-2 ring-indigo-300/70 dark:ring-indigo-500/50' : ''}`}
                        style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
                      >
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{task.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {task.description || 'No description'}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                          Due {formatDate(task.dueDate)} · Priority {task.priority}
                        </p>
                        {!isViewer && (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(task)}
                              className="flex-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-500/20 hover:text-indigo-700 dark:text-indigo-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingTask === task._id}
                              onClick={() => handleDeleteTask(task._id)}
                              className="flex-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-500/20 hover:text-rose-700 dark:text-rose-100 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">No tasks yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState description="Create a project to start planning work." />
          </div>
        )}
      </section>

      <UpdateTaskModal
        isOpen={isUpdateModalOpen}
        onClose={handleCloseEditModal}
        task={editingTask}
        onUpdate={handleEditTask}
        isLoading={formLoading}
      />
    </div>
  );
};

export default TasksPage;
