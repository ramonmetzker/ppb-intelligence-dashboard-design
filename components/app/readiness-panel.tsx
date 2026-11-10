import { Check, Circle, Warning } from '@phosphor-icons/react/dist/ssr'
import { Panel } from '@/components/app/panel'

const STEPS = [
  { label: 'Production actual', state: 'Complete' },
  { label: 'MB51 consumption', state: 'Complete' },
  { label: 'BOM snapshot', state: 'Complete' },
  { label: 'Material prices', state: 'Complete' },
  { label: 'Supplier origin', state: 'Complete' },
  { label: 'PPB classification', state: 'Warning' },
  { label: 'Calculation', state: 'Pending' },
] as const

const ATTENTION = [
  { text: '3 new models need BOM mapping', level: 'High' },
  { text: '12 materials missing supplier origin', level: 'Medium' },
  { text: '4 materials missing updated price', level: 'Low' },
]

export function ReadinessPanel() {
  const done = STEPS.filter((s) => s.state === 'Complete').length
  return (
    <Panel
      id="readiness"
      title="October closing"
      description={`${done} of ${STEPS.length} steps complete. Data feeding every simulation.`}
      className="h-full"
      bodyClassName="flex flex-col gap-4 p-4"
    >
      <ol className="flex flex-col gap-1.5">
        {STEPS.map((step) => (
          <li key={step.label} className="flex items-center gap-2.5 text-[12.5px]">
            {step.state === 'Complete' ? (
              <Check size={13} weight="bold" className="text-success" aria-hidden="true" />
            ) : step.state === 'Warning' ? (
              <Warning size={13} weight="fill" className="text-warning" aria-hidden="true" />
            ) : (
              <Circle size={13} className="text-muted-foreground" aria-hidden="true" />
            )}
            <span className={step.state === 'Complete' ? '' : 'font-medium'}>
              {step.label}
            </span>
            <span className="sr-only">{step.state}</span>
          </li>
        ))}
      </ol>

      <div className="border-t border-border pt-3">
        <p className="eyebrow mb-2">Needs attention</p>
        <ul className="flex flex-col gap-1.5">
          {ATTENTION.map((a) => (
            <li key={a.text} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="truncate">{a.text}</span>
              <span className="shrink-0 text-[10.5px] font-medium text-muted-foreground uppercase">
                {a.level}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
