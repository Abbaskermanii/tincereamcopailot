export default function CartLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-8 h-8 w-32 animate-pulse rounded-lg bg-char/10 dark:bg-white/10" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-char/10 bg-surface p-4 dark:border-white/10 dark:bg-black/20">
            <div className="h-20 w-20 animate-pulse rounded-lg bg-char/5 dark:bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-char/10 dark:bg-white/10" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-char/5 dark:bg-white/5" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-char/5 dark:bg-white/5" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 h-40 animate-pulse rounded-xl bg-char/5 dark:bg-white/5" />
    </div>
  );
}
