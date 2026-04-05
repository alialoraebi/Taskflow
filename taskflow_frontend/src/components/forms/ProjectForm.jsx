import { useState } from 'react';

const statuses = ['Planned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

const defaultValues = {
  name: '',
  description: '',
  status: 'Planned',
  progress: 0,
  startDate: '',
  endDate: '',
};

const ProjectForm = ({ onSubmit, isSubmitting }) => {
  const [form, setForm] = useState(defaultValues);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const updates = { ...prev, [name]: value };
      
      // Automatically set progress to 100% when status is changed to "Completed"
      if (name === 'status' && value === 'Completed') {
        updates.progress = 100;
      }
      
      return updates;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      progress: form.progress,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };

    const result = onSubmit(payload);

    if (result?.then) {
      result.then(() => setForm(defaultValues));
    } else {
      setForm(defaultValues);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Name</label>
        <input
          name="name"
          required
          value={form.name}
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
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">End Date</label>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-500/20 hover:text-indigo-900 dark:border-indigo-500/40 dark:text-indigo-100"
      >
        {isSubmitting ? 'Creating...' : 'Create project'}
      </button>
    </form>
  );
};

export default ProjectForm;
