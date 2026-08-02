// src/components/SkeletonLoaders.tsx

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="h-28 bg-white/5 rounded-3xl w-full border border-white/5" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5" />
        ))}
      </div>
      <div className="h-64 bg-white/5 rounded-3xl w-full border border-white/5" />
    </div>
  );
}

export function HabitListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 bg-white/5 rounded-2xl w-full border border-white/5" />
      ))}
    </div>
  );
}

export function CoachSkeleton() {
  return (
    <div className="space-y-4 animate-pulse p-4">
      <div className="h-12 bg-white/5 rounded-2xl w-3/4" />
      <div className="h-16 bg-white/5 rounded-2xl w-1/2 ml-auto" />
      <div className="h-20 bg-white/5 rounded-2xl w-2/3" />
    </div>
  );
}
