export default function SkeletonCard() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/3 aspect-square rounded-3xl border border-white/10 bg-white/10 animate-pulse" />

        <div className="w-full md:w-2/3 space-y-6">
          <div className="space-y-4">
            <div className="h-7 w-28 rounded-full bg-white/10 animate-pulse" />
            <div className="h-12 w-4/5 rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-7 w-1/3 rounded-2xl bg-white/10 animate-pulse" />
          </div>

          <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="w-28 h-28 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                <div className="h-20 rounded-2xl bg-white/10 animate-pulse" />
                <div className="h-20 rounded-2xl bg-white/10 animate-pulse" />
                <div className="h-20 rounded-2xl bg-white/10 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="h-6 w-32 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-4 w-full rounded-xl bg-white/10 animate-pulse" />
          <div className="h-4 w-11/12 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-4 w-4/5 rounded-xl bg-white/10 animate-pulse" />
        </div>

        <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="h-6 w-28 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-8 w-32 rounded-2xl bg-white/10 animate-pulse" />
          <div className="h-4 w-full rounded-xl bg-white/10 animate-pulse" />
          <div className="h-4 w-3/4 rounded-xl bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
