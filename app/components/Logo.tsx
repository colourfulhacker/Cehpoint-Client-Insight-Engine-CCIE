export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded flex items-center justify-center">
        <span className="text-sm font-bold text-white dark:text-slate-900">C</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-slate-900 dark:text-white">
          Cehpoint
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Client Insights
        </span>
      </div>
    </div>
  );
}
