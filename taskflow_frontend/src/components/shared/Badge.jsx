const badgeStyles = {
  default:
    'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  danger:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
  info:
    'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200',
};

const Badge = ({ children, variant = 'default' }) => (
  <span
    className={`inline-flex items-center rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${
      badgeStyles[variant] || badgeStyles.default
    }`}
  >
    {children}
  </span>
);

export default Badge;
