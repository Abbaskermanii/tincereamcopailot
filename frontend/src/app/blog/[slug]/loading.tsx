export default function ArticleLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 md:px-6">
      <div className="h-4 w-48 rounded-full bg-char/10 dark:bg-white/10" />
      <div className="mt-8 max-w-3xl space-y-4">
        <div className="h-8 w-28 rounded-full bg-char/10 dark:bg-white/10" />
        <div className="h-12 w-full rounded-2xl bg-char/10 dark:bg-white/10" />
        <div className="h-12 w-2/3 rounded-2xl bg-char/10 dark:bg-white/10" />
      </div>
      <div className="mt-8 aspect-[16/9] max-w-3xl rounded-3xl bg-char/10 dark:bg-white/10" />
      <div className="mt-8 max-w-3xl space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={`h-4 rounded-full bg-char/8 dark:bg-white/8 ${i % 3 === 2 ? "w-2/3" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}
