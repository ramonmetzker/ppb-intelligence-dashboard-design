export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <header className="flex min-h-16 flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] leading-7 font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-0.5 max-w-3xl text-[13px] leading-5 text-muted-foreground">{description}</p>
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 pb-0.5 [&_[data-slot=button]]:h-9 [&_[data-slot=button]]:min-w-32 [&_[data-slot=button]]:justify-center">
          {children}
        </div>
      )}
    </header>
  )
}
