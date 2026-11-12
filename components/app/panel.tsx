import { cn } from '@/lib/utils'

export function Panel({
  id,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  id?: string
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  const headingId = id ? `${id}-heading` : undefined
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('flex min-w-0 flex-col rounded-lg border border-border bg-card', className)}
    >
      <header className="flex flex-col items-start gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="font-display text-[15px] leading-5 font-semibold tracking-tight"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[12px] leading-4 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn('flex-1 p-4', bodyClassName)}>{children}</div>
    </section>
  )
}
