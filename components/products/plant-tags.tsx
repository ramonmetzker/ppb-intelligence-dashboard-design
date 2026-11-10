import { parsePlants } from '@/lib/products/data'
import { cn } from '@/lib/utils'

const tagClass =
  'inline-flex h-6 shrink-0 items-center rounded-md border border-border bg-muted px-2 text-xs font-medium text-foreground'

/**
 * Renders a comma separated plants string as tags. With `max`, extra plants collapse
 * into a "+N" tag so a table row keeps a fixed height.
 */
export function PlantTags({ value, max, className }: { value: string; max?: number; className?: string }) {
  const plants = parsePlants(value)
  if (plants.length === 0) return <span className="text-muted-foreground/60">-</span>

  const visible = max ? plants.slice(0, max) : plants
  const hidden = plants.length - visible.length

  return (
    <ul aria-label="Plants" title={plants.join(', ')} className={cn('flex min-w-0 items-center gap-1', className)}>
      {visible.map((plant) => (
        <li key={plant} className={tagClass}>
          {plant}
        </li>
      ))}
      {hidden > 0 && (
        <li className={cn(tagClass, 'bg-transparent text-muted-foreground')}>
          <span aria-hidden="true">+{hidden}</span>
          <span className="sr-only">{`and ${hidden} more`}</span>
        </li>
      )}
    </ul>
  )
}
