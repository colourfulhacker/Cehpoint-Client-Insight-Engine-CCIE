export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-md flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
        <span className="text-sm font-black text-white leading-none">C</span>
      </div>
      <div className="flex flex-col leading-snug">
        <span className="text-base font-bold text-white tracking-tight">
          Cehpoint
        </span>
        <span className="text-xs font-medium text-slate-300 leading-tight">
          Client Insights
        </span>
      </div>
    </div>
  );
}
