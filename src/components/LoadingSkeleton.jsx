export const TableSkeleton = () => {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white/5 rounded-lg animate-pulse"
        >
          <div className="w-8 h-8 bg-white/10 rounded" />
          <div className="w-8 h-8 bg-white/10 rounded-full" />
          <div className="flex-1 h-4 bg-white/10 rounded" />
          <div className="w-12 h-4 bg-white/10 rounded" />
          <div className="w-12 h-4 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
};

export const FixtureSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 bg-white/5 rounded-lg animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-white/10 rounded-full" />
              <div className="h-4 w-24 bg-white/10 rounded" />
            </div>
            <div className="h-4 w-8 bg-white/10 rounded" />
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="w-8 h-8 bg-white/10 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ScenarioSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="p-5 bg-white/5 rounded-lg border border-white/10 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-6 w-20 bg-white/10 rounded-full" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-white/10 rounded-full" />
              <div className="h-4 w-24 bg-white/10 rounded" />
            </div>
            <div className="h-4 w-8 bg-white/10 rounded" />
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="w-8 h-8 bg-white/10 rounded-full" />
            </div>
          </div>
          <div className="pt-3 border-t border-white/10">
            <div className="h-4 bg-white/10 rounded w-full mb-2" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};
