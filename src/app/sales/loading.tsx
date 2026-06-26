// Sales: month selector + two count sections (Overall / LEANR team).
export default function Loading() {
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="h-6 w-28 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-zinc-200" />
        </div>
        <div className="h-9 w-40 animate-pulse rounded bg-zinc-200" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="h-3 w-40 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-10 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-4">
              {[0, 1, 2].map((j) => (
                <div key={j}>
                  <div className="h-3 w-12 animate-pulse rounded bg-zinc-200" />
                  <div className="mt-1 h-7 w-10 animate-pulse rounded bg-zinc-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
