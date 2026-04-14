export default function TrajetLoading() {
  return (
    <div className="pt-24 px-6 pb-32 space-y-6">
      {/* Map skeleton */}
      <div className="h-48 shimmer rounded-3xl" />
      {/* Driver card */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-surface-container-low rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-container-high" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-surface-container-high rounded-full w-3/4" />
              <div className="h-3 bg-surface-container-high rounded-full w-1/2" />
            </div>
          </div>
        </div>
        <div className="bg-surface-container-low rounded-3xl p-6">
          <div className="h-3 bg-surface-container-high rounded-full w-full mb-3" />
          <div className="h-8 bg-surface-container-high rounded-full w-2/3" />
        </div>
      </div>
      {/* Vehicle */}
      <div className="bg-surface-container-low rounded-3xl p-6 space-y-3">
        <div className="h-3 bg-surface-container-high rounded-full w-1/3" />
        <div className="h-5 bg-surface-container-high rounded-full w-2/3" />
        <div className="h-4 bg-surface-container-high rounded-full w-1/2" />
      </div>
      {/* Policy */}
      <div className="bg-surface-container-low rounded-3xl p-6 h-24" />
    </div>
  );
}
