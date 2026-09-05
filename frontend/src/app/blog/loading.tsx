export default function BlogLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <section className="border-b border-char/5 px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="h-12 w-32 animate-pulse rounded-lg bg-char/8 dark:bg-white/8" />
          <div className="mt-3 h-5 w-72 animate-pulse rounded bg-char/5 dark:bg-white/5" />
          <div className="mt-6 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-char/5 dark:bg-white/5" />
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Lead story skeleton */}
        <section className="py-8 md:py-12">
          <div className="mb-6 h-[400px] animate-pulse rounded-2xl bg-char/5 md:h-[480px] dark:bg-white/5" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-wobble bg-surface dark:bg-[#262320]">
                <div className="aspect-[16/10] animate-pulse bg-char/5 dark:bg-white/5" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-16 animate-pulse rounded bg-char/8 dark:bg-white/8" />
                  <div className="h-4 w-full animate-pulse rounded bg-char/5 dark:bg-white/5" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-char/5 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feed + sidebar skeleton */}
        <section className="flex gap-8 py-8 md:py-12">
          <div className="min-w-0 flex-1 space-y-0">
            <div className="mb-4 h-3 w-24 animate-pulse rounded bg-char/5 dark:bg-white/5" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-char/5 py-5 dark:border-white/5">
                <div className="h-24 w-28 shrink-0 animate-pulse rounded-xl bg-char/5 sm:w-32 dark:bg-white/5" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-16 animate-pulse rounded bg-char/8 dark:bg-white/8" />
                  <div className="h-4 w-full animate-pulse rounded bg-char/5 dark:bg-white/5" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-char/5 dark:bg-white/5" />
                  <div className="h-2.5 w-1/3 animate-pulse rounded bg-char/5 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden w-72 shrink-0 space-y-6 lg:block">
            <div className="h-4 w-32 animate-pulse rounded bg-char/5 dark:bg-white/5" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 border-b border-char/5 py-3 dark:border-white/5">
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-char/5 dark:bg-white/5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded bg-char/5 dark:bg-white/5" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-char/5 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
