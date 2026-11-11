'use client'

import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isValidCron, normalizeCron } from '@/lib/rpa/cron'
import type { Rpa } from '@/lib/rpa/data'
import { ScheduleField } from './schedule-field'

type Props = {
  rpa: Rpa | null
  onOpenChange: (open: boolean) => void
  onSave: (id: string, schedule: string) => void
}

export function RpaScheduleDialog({ rpa, onOpenChange, onSave }: Props) {
  return (
    <Dialog open={rpa !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {rpa && (
          <ScheduleForm
            key={rpa.id}
            rpa={rpa}
            onCancel={() => onOpenChange(false)}
            onSave={(schedule) => {
              onSave(rpa.id, schedule)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ScheduleForm({
  rpa,
  onCancel,
  onSave,
}: {
  rpa: Rpa
  onCancel: () => void
  onSave: (schedule: string) => void
}) {
  const uid = useId()
  const [schedule, setSchedule] = useState(rpa.schedule)
  const valid = isValidCron(schedule)
  const unchanged = normalizeCron(schedule) === rpa.schedule

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (valid) onSave(normalizeCron(schedule))
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Change schedule</DialogTitle>
        <DialogDescription>
          {rpa.id} · {rpa.name}. The new schedule applies from the next run.
        </DialogDescription>
      </DialogHeader>

      <ScheduleField id={`${uid}-schedule`} value={schedule} onChange={setSchedule} />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || unchanged}>
          Save schedule
        </Button>
      </DialogFooter>
    </form>
  )
}
