const EmptyState = ({ title = 'Nothing to show yet', description }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
    <p className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
      {title}
    </p>
    {description && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
  </div>
);

export default EmptyState;
