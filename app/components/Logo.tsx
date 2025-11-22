export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-xs font-bold text-white dark:text-slate-900 leading-none">C</span>
      </div>
      <div className="flex flex-col leading-snug">
        <span className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
          Cehpoint
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
          Client Insights
        </span>
      </div>
    </div>
  );
}
