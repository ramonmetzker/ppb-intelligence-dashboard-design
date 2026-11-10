import type { ReactNode } from 'react'

/**
 * Standard slot for page-level actions, rendered inside `PageHeader`.
 *
 * Convention for every data page:
 * - `primary`: the single "add new" button (solid, with a Plus icon), always last / rightmost.
 * - `secondary`: supporting actions such as Import or Export (outline buttons), placed before it.
 * Table-specific controls (filters, columns, density) stay in the table toolbar, never here.
 */
export function PageActions({ primary, secondary }: { primary?: ReactNode; secondary?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {secondary}
      {primary}
    </div>
  )
}
