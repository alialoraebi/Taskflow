const gradientMap = {
  purple: 'from-indigo-500/20 to-purple-500/20 text-indigo-100',
  blue: 'from-sky-500/20 to-cyan-500/20 text-sky-100',
  emerald: 'from-emerald-500/20 to-lime-500/20 text-emerald-100',
  rose: 'from-rose-500/20 to-orange-500/20 text-rose-100',
};

const StatCard = ({ label, value, helper, accent = 'purple' }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
    <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">{value}</p>
    {helper && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>}
    <div className={`mt-6 h-1 rounded-full bg-gradient-to-r ${gradientMap[accent]}`} />
  </div>
);

export default StatCard;
