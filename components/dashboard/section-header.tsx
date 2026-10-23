export function SectionHeader({
  id,
  title,
  description,
  aside,
}: {
  id: string
  title: string
  description?: string
  aside?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-6">
      <div>
        <h2 id={id} className="text-[19px] font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
      {aside}
    </div>
  )
}
