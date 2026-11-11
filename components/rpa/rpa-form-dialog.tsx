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
import { Input } from '@/components/ui/input'
import { isValidCron, normalizeCron } from '@/lib/rpa/cron'
import type { RpaNotifications } from '@/lib/rpa/data'
import { NotificationOptions } from './notification-options'
import { ScheduleField } from './schedule-field'

export type RpaFormValues = {
  name: string
  description: string
  schedule: string
  notifications: RpaNotifications
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingNames: readonly string[]
  onSubmit: (values: RpaFormValues) => void
}

export function RpaFormDialog({ open, onOpenChange, existingNames, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <RpaForm
          existingNames={existingNames}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            onSubmit(values)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function RpaForm({
  existingNames,
  onCancel,
  onSubmit,
}: Pick<Props, 'existingNames' | 'onSubmit'> & { onCancel: () => void }) {
  const uid = useId()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [schedule, setSchedule] = useState('0 6 * * *')
  const [notifications, setNotifications] = useState<RpaNotifications>({ success: false, error: true })
  const [nameError, setNameError] = useState<string>()
  const [scheduleError, setScheduleError] = useState<string>()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanName = name.trim()
    const nameProblem = !cleanName
      ? 'Enter a name for the RPA.'
      : existingNames.some((existing) => existing.toLowerCase() === cleanName.toLowerCase())
        ? 'Another RPA already uses this name.'
        : undefined
    const scheduleProblem = isValidCron(schedule) ? undefined : 'Enter a valid 5 field cron expression.'

    setNameError(nameProblem)
    setScheduleError(scheduleProblem)
    if (nameProblem || scheduleProblem) return

    onSubmit({
      name: cleanName,
      description: description.trim(),
      schedule: normalizeCron(schedule),
      notifications,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>New RPA</DialogTitle>
        <DialogDescription>Register a robot to monitor. It starts enabled and runs on the schedule below.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-name`} className="text-xs font-medium text-foreground">
          RPA name
        </label>
        <Input
          id={`${uid}-name`}
          value={name}
          autoFocus
          aria-invalid={Boolean(nameError)}
          onChange={(event) => setName(event.target.value)}
        />
        {nameError && (
          <p role="alert" className="text-xs text-critical">
            {nameError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-description`} className="text-xs font-medium text-foreground">
          Description
        </label>
        <Input
          id={`${uid}-description`}
          value={description}
          placeholder="What does this robot do?"
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <ScheduleField id={`${uid}-schedule`} value={schedule} onChange={setSchedule} error={scheduleError} />

      <NotificationOptions value={notifications} onChange={setNotifications} />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Register RPA</Button>
      </DialogFooter>
    </form>
  )
}
