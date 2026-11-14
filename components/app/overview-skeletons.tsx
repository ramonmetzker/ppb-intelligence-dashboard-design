import { Skeleton } from '@/components/ui/skeleton'

function LoadingRegion({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">Loading data</span>
      {children}
    </div>
  )
}

export function StoryStatusSkeleton() {
  return (
    <LoadingRegion className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Skeleton className="h-3 w-52" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2 px-4 py-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-4">
        <Skeleton className="h-10 w-full" />
      </div>
    </LoadingRegion>
  )
}

export function VolumePanelSkeleton() {
  return (
    <LoadingRegion className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-14" />
          ))}
        </div>
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="px-4 py-4">
        <Skeleton className="h-[250px] w-full rounded-md" />
      </div>
      <div className="border-t border-border px-4 py-3">
        <Skeleton className="h-3 w-80 max-w-full" />
      </div>
    </LoadingRegion>
  )
}

export function TrajectoryPanelSkeleton() {
  return (
    <LoadingRegion className="flex min-h-[380px] flex-col rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="mt-6 min-h-[280px] w-full flex-1 rounded-md" />
    </LoadingRegion>
  )
}

export function PlanSummarySkeleton() {
  return (
    <LoadingRegion className="flex min-h-[380px] flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="mx-4 h-10" />
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
