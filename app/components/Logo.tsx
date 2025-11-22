export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
        <span className="text-sm font-bold text-white">C</span>
      </div>
      <div className="flex flex-col">
        <span className="text-base font-semibold text-gray-900">
          Cehpoint
        </span>
        <span className="text-xs text-gray-500">
          Client Insights
        </span>
      </div>
    </div>
  );
}
