export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-8 h-8 bg-slate-950 rounded-md flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-white leading-none">C</span>
      </div>
      <div className="flex flex-col leading-snug">
        <span className="text-base font-bold text-slate-950 tracking-tight">
          Cehpoint
        </span>
        <span className="text-xs font-medium text-slate-500 leading-tight">
          Client Insights
        </span>
      </div>
    </div>
  );
}
