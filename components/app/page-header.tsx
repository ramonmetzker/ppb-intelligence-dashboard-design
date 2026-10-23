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
    <div className="flex flex-col gap-2 pb-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-[22px] leading-7 font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
