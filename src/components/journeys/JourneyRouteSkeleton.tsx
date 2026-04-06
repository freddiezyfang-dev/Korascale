/**
 * 旅程相关路由的占位骨架（米白背景，与全站 A&K 风格一致）
 */

export function JourneyTypePageSkeleton() {
  return (
    <main className="min-h-screen bg-[#f5f1e6]">
      <div className="relative h-[min(800px,85vh)] w-full overflow-hidden animate-pulse">
        <div className="flex h-full w-full flex-col md:flex-row">
          <div className="h-1/2 w-full bg-[#e8e4d9] md:h-full md:w-1/2" />
          <div className="flex h-1/2 flex-col gap-4 p-6 md:h-full md:w-1/2 md:p-10">
            <div className="h-4 w-40 rounded bg-[#ddd8cc]" />
            <div className="h-12 w-3/4 max-w-md rounded bg-[#ddd8cc]" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-[#e0dbd0]" />
              <div className="h-3 w-full rounded bg-[#e0dbd0]" />
              <div className="h-3 w-5/6 rounded bg-[#e0dbd0]" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 h-6 w-48 rounded bg-[#ddd8cc] animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-lg bg-[#e8e4d9] animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}

export function JourneyDetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f1e6]">
      <div className="relative h-[min(520px,70vh)] w-full animate-pulse bg-[#1e3b32]/20">
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e3b32]/50 to-transparent" />
        <div className="absolute bottom-12 left-8 right-8 lg:left-16">
          <div className="mb-4 h-10 max-w-xl rounded bg-white/30" />
          <div className="h-6 max-w-md rounded bg-white/20" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-4">
        <div className="h-4 w-32 rounded bg-[#ddd8cc] animate-pulse" />
        <div className="h-3 w-full rounded bg-[#e0dbd0] animate-pulse" />
        <div className="h-3 w-full rounded bg-[#e0dbd0] animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-[#e0dbd0] animate-pulse" />
      </div>
    </div>
  );
}
