import { useState, useEffect } from 'react';

const priorities = ['Low', 'Medium', 'High', 'Critical'];
const statuses = ['Todo', 'In Progress', 'Review', 'Completed', 'Blocked'];

const defaultValues = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Todo',
  dueDate: '',
};

const TaskForm = ({ onSubmit, disabled, initialValues }) => {
  const [form, setForm] = useState(
    initialValues
      ? {
          ...initialValues,
          dueDate: initialValues.dueDate ? initialValues.dueDate.split('T')[0] : '',
        }
      : defaultValues,
  );

  useEffect(() => {
    if (initialValues) {
      setForm({
        ...initialValues,
        dueDate: initialValues.dueDate ? initialValues.dueDate.split('T')[0] : '',
      });
    } else {
      setForm(defaultValues);
    }
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = onSubmit({
      ...form,
      dueDate: form.dueDate || null,
    });

    if (result?.then) {
      result.then(() => setForm(defaultValues));
    } else {
      setForm(defaultValues);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Title</label>
        <input
          name="title"
          required
          value={form.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
        <textarea
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="mt-1 block w-full rounded-2xl border border-slate-300 bg-white pr-8 pl-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            {priorities.map((priority) => (
              <option value={priority} key={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-2xl border border-slate-300 bg-white pr-8 pl-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            {statuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Due date</label>
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/20 hover:text-emerald-900 dark:text-emerald-100"
      >
        {disabled ? 'Working...' : initialValues ? 'Update task' : 'Add task'}
      </button>
    </form>
  );
};

export default TaskForm;
