'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Rpa, RpaNotifications } from '@/lib/rpa/data'
import { NotificationOptions } from './notification-options'

type Props = {
  rpa: Rpa | null
  onOpenChange: (open: boolean) => void
  onSave: (id: string, notifications: RpaNotifications) => void
}

export function RpaNotificationsDialog({ rpa, onOpenChange, onSave }: Props) {
  return (
    <Dialog open={rpa !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {rpa && (
          <NotificationsForm
            key={rpa.id}
            rpa={rpa}
            onCancel={() => onOpenChange(false)}
            onSave={(notifications) => {
              onSave(rpa.id, notifications)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function NotificationsForm({
  rpa,
  onCancel,
  onSave,
}: {
  rpa: Rpa
  onCancel: () => void
  onSave: (notifications: RpaNotifications) => void
}) {
  const [value, setValue] = useState(rpa.notifications)
  const unchanged = value.success === rpa.notifications.success && value.error === rpa.notifications.error

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave(value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Notifications</DialogTitle>
        <DialogDescription>
          {rpa.id} · {rpa.name}. Choose which results you want to be notified about.
        </DialogDescription>
      </DialogHeader>

      <NotificationOptions value={value} onChange={setValue} />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={unchanged}>
          Save preferences
        </Button>
      </DialogFooter>
    </form>
  )
}
