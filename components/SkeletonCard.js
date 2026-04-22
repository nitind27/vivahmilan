export default function SkeletonCard() {
  return (
    <div className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl overflow-hidden shadow-sm border border-vd-border">
      <div className="h-56 skeleton" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-4 w-12 skeleton rounded" />
        </div>
        <div className="h-3 w-40 skeleton rounded" />
        <div className="h-3 w-36 skeleton rounded" />
        <div className="h-3 w-28 skeleton rounded" />
        <div className="h-6 w-20 skeleton rounded-full" />
      </div>
    </div>
  );
}
