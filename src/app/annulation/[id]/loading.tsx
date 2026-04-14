export default function AnnulationLoading() {
  return (
    <div className="pt-24 px-6 pb-32 space-y-8">
      {/* Title */}
      <div className="space-y-3">
        <div className="h-10 shimmer rounded-full w-3/4" />
        <div className="h-4 shimmer rounded-full w-full" />
        <div className="h-4 shimmer rounded-full w-2/3" />
      </div>
      {/* Cards */}
      <div className="bg-surface-container-low rounded-3xl p-6 h-40" />
      <div className="bg-surface-container-low rounded-3xl p-6 h-32 opacity-50" />
      {/* Ride context */}
      <div className="bg-primary-container/30 rounded-3xl p-6 h-36" />
    </div>
  );
}
