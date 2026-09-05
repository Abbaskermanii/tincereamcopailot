export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-char/10 dark:bg-white/10" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-char/10 bg-surface p-3 dark:border-white/10 dark:bg-black/20">
            <div className="mb-3 aspect-square animate-pulse rounded-lg bg-char/5 dark:bg-white/5" />
            <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-char/10 dark:bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-char/10 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
