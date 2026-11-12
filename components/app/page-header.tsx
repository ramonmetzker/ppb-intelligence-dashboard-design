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
    <header className="flex min-h-16 flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] leading-7 font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-0.5 max-w-3xl text-[13px] leading-5 text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}
