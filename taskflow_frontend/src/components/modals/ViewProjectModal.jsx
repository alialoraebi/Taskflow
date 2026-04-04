import Modal from '../shared/Modal';
import Badge from '../shared/Badge';
import { formatDate } from '../../utils/format';

const ViewProjectModal = ({ isOpen, onClose, project }) => {
  if (!project) return null;

  const tasks = project.relatedTasks || [];
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project.name}>
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Status</p>
          <div className="mt-1">
            <Badge variant={project.status === 'Completed' ? 'success' : 'info'}>
              {project.status}
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Timeline</p>
          <p className="mt-1 text-sm text-slate-900 dark:text-white">
            {formatDate(project.startDate)} → {formatDate(project.endDate)}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Description</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            {project.description || 'No description provided.'}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Tasks</p>
          <p className="mt-1 text-sm text-slate-900 dark:text-white">
            {completedTasks} of {tasks.length} completed
          </p>
          <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${tasks.length ? (completedTasks / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ViewProjectModal;
