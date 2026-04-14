export default function MessagerieLoading() {
  return (
    <div className="pt-24 px-6 pb-32 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container-high" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-surface-container-high rounded-full w-1/3" />
          <div className="h-2 bg-surface-container-high rounded-full w-1/4" />
        </div>
      </div>
      {/* Message bubbles */}
      <div className="space-y-5">
        <div className="self-start max-w-[70%]">
          <div className="h-16 bg-surface-container-lowest rounded-xl rounded-tl-none" />
        </div>
        <div className="ml-auto max-w-[70%]">
          <div className="h-12 bg-surface-container-high rounded-xl rounded-tr-none" />
        </div>
        <div className="self-start max-w-[60%]">
          <div className="h-20 bg-surface-container-lowest rounded-xl rounded-tl-none" />
        </div>
      </div>
    </div>
  );
}
