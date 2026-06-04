export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7 animate-pulse">
        <div className="h-3 w-24 rounded bg-muted mb-2" />
        <div className="h-5 w-40 rounded bg-muted" />
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-7 space-y-6">
        <div className="rounded-xl border bg-card p-6 animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 rounded bg-muted" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card animate-pulse">
          <div className="border-b px-6 py-4">
            <div className="h-4 w-40 rounded bg-muted" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-b px-6 py-4 flex gap-4">
              <div className="h-4 flex-1 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
