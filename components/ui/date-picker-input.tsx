'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type IsoDatePickerInputProps = {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3])
    ? date
    : undefined
}

function toIsoDate(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function IsoDatePickerInput({ id, value, onChange, placeholder = 'YYYY-MM-DD', invalid = false }: IsoDatePickerInputProps) {
  const [open, setOpen] = useState(false)
  const selected = parseIsoDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup>
        <InputGroupInput
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          maxLength={10}
          value={value}
          aria-invalid={invalid}
          onChange={(event) => onChange(formatDateInput(event.target.value))}
          className="font-mono"
        />
        <InputGroupAddon align="inline-end" className="p-0">
          <PopoverTrigger
            render={
              <InputGroupButton size="icon-sm" aria-label="Open date picker">
                <CalendarDays />
              </InputGroupButton>
            }
          />
        </InputGroupAddon>
      </InputGroup>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) onChange(toIsoDate(date))
            setOpen(false)
          }}
          defaultMonth={selected ?? new Date()}
          captionLayout="dropdown"
          startMonth={new Date(1900, 0, 1)}
          endMonth={new Date(2999, 11, 31)}
          className="rounded-md border [--cell-size:--spacing(8)]"
        />
      </PopoverContent>
    </Popover>
  )
}

export { formatDateInput }
