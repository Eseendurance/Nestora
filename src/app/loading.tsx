export default function Loading() {
  return (
    <section className="section">
      <div className="container-page">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-12 w-full max-w-3xl rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-6 w-full max-w-xl rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-52 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
