export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{text}</span>
    </div>
  );
}
