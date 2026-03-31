export default function StatCard({ title, value, tone = "neutral" }) {
  const toneClass = {
    neutral: "border-slate-200 dark:border-slate-700",
    good: "border-emerald-300 dark:border-emerald-700",
    warning: "border-amber-300 dark:border-amber-700",
    danger: "border-rose-300 dark:border-rose-700"
  };

  return (
    <div className={`animate-floatIn rounded-2xl border bg-white p-4 shadow-soft dark:bg-slate-900 ${toneClass[tone]}`}>
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
