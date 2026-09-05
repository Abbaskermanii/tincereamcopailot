export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-char/5 dark:bg-white/5" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-char/10 dark:bg-white/10" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-char/10 dark:bg-white/10" />
          <div className="h-10 w-1/4 animate-pulse rounded-lg bg-char/10 dark:bg-white/10" />
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full animate-pulse rounded bg-char/5 dark:bg-white/5" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-char/5 dark:bg-white/5" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-char/5 dark:bg-white/5" />
          </div>
          <div className="flex gap-3 pt-6">
            <div className="h-12 flex-1 animate-pulse rounded-xl bg-char/10 dark:bg-white/10" />
            <div className="h-12 w-12 animate-pulse rounded-xl bg-char/10 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
