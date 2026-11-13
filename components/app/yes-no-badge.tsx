import { CheckCircle2, CircleX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function YesNoBadge({ value }: { value: 'Y' | 'N' }) {
  const enabled = value === 'Y'

  return (
    <Badge variant={enabled ? 'secondary' : 'outline'} className="gap-1.5">
      {enabled ? <CheckCircle2 aria-hidden="true" /> : <CircleX aria-hidden="true" />}
      {enabled ? 'Yes' : 'No'}
    </Badge>
  )
}
