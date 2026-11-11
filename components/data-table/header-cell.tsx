'use client'

import { useState, type CSSProperties, type DragEvent, type PointerEvent } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  EyeOff,
  GripVertical,
  ListFilter,
  MoreHorizontal,
  Pin,
  PinOff,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ColumnFilter, DataTableColumn, SortDirection } from '@/lib/data-table/types'
import { cn } from '@/lib/utils'
import { ColumnFilterEditor } from './column-filter'
import type { DataTableLabels } from './filter-utils'

type Props<T> = {
  column: DataTableColumn<T>
  style: CSSProperties
  pinned: boolean
  edge?: 'left' | 'right'
  rowSpan?: number
  groupStart?: boolean
  groupEnd?: boolean
  stickyHeader: boolean
  sortable: boolean
  filterable: boolean
  pinnable: boolean
  resizable: boolean
  reorderable: boolean
  dragging: boolean
  dragTarget: boolean
  canMoveLeft: boolean
  canMoveRight: boolean
  sortDirection: SortDirection | false
  /** 1-based position when more than one column is sorted, otherwise undefined. */
  sortIndex?: number
  filter?: ColumnFilter
  labels: DataTableLabels
  onSort: (direction: SortDirection | null, additive: boolean) => void
  onToggleSort: (additive: boolean) => void
  onFilter: (filter: ColumnFilter | null) => void
  onPin: (pin: 'left' | 'right' | null) => void
  onMove: (direction: -1 | 1) => void
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void
  onDragOver: (event: DragEvent<HTMLTableCellElement>) => void
  onDrop: (event: DragEvent<HTMLTableCellElement>) => void
  onDragEnd: () => void
  onResizeStart: (event: PointerEvent<HTMLButtonElement>) => void
  onResizeBy: (direction: -1 | 1) => void
  onHide?: () => void
}

const iconButton =
  'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 outline-none transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring group-hover/th:text-muted-foreground data-[popup-open]:bg-background data-[popup-open]:text-foreground'

export function HeaderCell<T>({
  column,
  style,
  pinned,
  edge,
  rowSpan,
  groupStart,
  groupEnd,
  stickyHeader,
  sortable,
  filterable,
  pinnable,
  resizable,
  reorderable,
  dragging,
  dragTarget,
  canMoveLeft,
  canMoveRight,
  sortDirection,
  sortIndex,
  filter,
  labels,
  onSort,
  onToggleSort,
  onFilter,
  onPin,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onResizeStart,
  onResizeBy,
  onHide,
}: Props<T>) {
  const [filterOpen, setFilterOpen] = useState(false)
  const align = column.align ?? (column.kind === 'number' ? 'right' : 'left')
  const hasMenu = sortable || pinnable || reorderable || Boolean(onHide)
  const SortIcon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown

  const label = column.renderHeader ? (
    column.renderHeader({ column, sorted: sortDirection })
  ) : (
    <span className="truncate">{column.header}</span>
  )

  return (
    <th
      scope="col"
      rowSpan={rowSpan}
      style={style}
      data-edge={edge}
      data-drag-target={dragTarget || undefined}
      aria-sort={sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : undefined}
      title={column.description ? `${column.header} — ${column.description}` : column.header}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'dt-cell group/th h-10 border-b border-border bg-muted px-1.5 text-left text-xs font-medium text-muted-foreground',
        stickyHeader ? 'sticky top-0' : 'relative',
        pinned ? 'z-30' : 'z-20',
        groupStart && 'border-l border-border',
        groupEnd && 'border-r border-border',
        dragTarget && 'ring-2 ring-inset ring-brand',
        dragging && 'opacity-60',
        column.headerClassName,
      )}
    >
      <div className="flex min-w-0 items-center gap-0.5">
        {reorderable && (
          <button
            type="button"
            draggable
            data-no-row-click
            aria-label={labels.moveColumn(column.header)}
            title={labels.moveColumn(column.header)}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={cn(iconButton, 'w-3.5 cursor-grab touch-none active:cursor-grabbing')}
          >
            <GripVertical aria-hidden="true" className="size-3" />
          </button>
        )}
        {sortable ? (
          <button
            type="button"
            onClick={(event) => onToggleSort(event.shiftKey)}
            className={cn(
              'flex h-7 w-full min-w-0 items-center gap-1 rounded-md px-1.5 outline-none hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
              align === 'right' && 'justify-end',
              align === 'center' && 'justify-center',
              sortDirection && 'text-foreground',
            )}
            aria-label={`${column.header}${
              sortDirection ? `, ${sortDirection === 'asc' ? labels.sortedAsc : labels.sortedDesc}` : ''
            }. ${labels.sortHint}`}
          >
            {label}
            {sortDirection && <SortIcon aria-hidden="true" className="size-3 shrink-0 text-brand" />}
            {sortIndex !== undefined && (
              <span aria-hidden="true" className="tnum -ml-0.5 text-[10px] text-brand">
                {sortIndex}
              </span>
            )}
          </button>
        ) : (
          <span
            className={cn(
              'flex h-7 w-full min-w-0 items-center px-1.5',
              align === 'right' && 'justify-end',
              align === 'center' && 'justify-center',
            )}
          >
            {label}
          </span>
        )}

        <div className="flex shrink-0 items-center">
          {filterable && (
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger
                className={cn(iconButton, filter && 'bg-brand-soft text-brand-deep opacity-100 hover:bg-brand-soft')}
                aria-label={filter ? `${labels.filterColumn(column.header)}. ${labels.filterActive}` : labels.filterColumn(column.header)}
              >
                <ListFilter aria-hidden="true" className="size-3.5" />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-3">
                <ColumnFilterEditor
                  schema={column}
                  filter={filter}
                  labels={labels}
                  onApply={(next) => {
                    onFilter(next)
                    setFilterOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          )}

          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger className={iconButton} aria-label={labels.columnMenu(column.header)}>
                <MoreHorizontal aria-hidden="true" className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-44">
                {sortable && (
                  <>
                    <DropdownMenuItem onClick={() => onSort('asc', false)}>
                      <ArrowUp aria-hidden="true" />
                      {labels.sortAsc}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSort('desc', false)}>
                      <ArrowDown aria-hidden="true" />
                      {labels.sortDesc}
                    </DropdownMenuItem>
                    {sortDirection && (
                      <DropdownMenuItem onClick={() => onSort(null, false)}>
                        <ArrowUpDown aria-hidden="true" />
                        {labels.clearSort}
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {sortable && (pinnable || reorderable || onHide) && <DropdownMenuSeparator />}
                {pinnable && (
                  <>
                    {column.pin !== 'left' && (
                      <DropdownMenuItem onClick={() => onPin('left')}>
                        <Pin aria-hidden="true" />
                        {labels.pinLeft}
                      </DropdownMenuItem>
                    )}
                    {column.pin !== 'right' && (
                      <DropdownMenuItem onClick={() => onPin('right')}>
                        <Pin aria-hidden="true" className="-scale-x-100" />
                        {labels.pinRight}
                      </DropdownMenuItem>
                    )}
                    {column.pin && (
                      <DropdownMenuItem onClick={() => onPin(null)}>
                        <PinOff aria-hidden="true" />
                        {labels.unpin}
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {reorderable && (
                  <>
                    {pinnable && <DropdownMenuSeparator />}
                    <DropdownMenuItem disabled={!canMoveLeft} onClick={() => onMove(-1)}>
                      <ArrowLeft aria-hidden="true" />
                      {labels.moveColumnLeft}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!canMoveRight} onClick={() => onMove(1)}>
                      <ArrowRight aria-hidden="true" />
                      {labels.moveColumnRight}
                    </DropdownMenuItem>
                  </>
                )}
                {onHide && (
                  <>
                    {(pinnable || reorderable) && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={onHide}>
                      <EyeOff aria-hidden="true" />
                      {labels.hideColumn}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {resizable && (
        <button
          type="button"
          data-no-row-click
          aria-label={labels.resizeColumn(column.header)}
          title={labels.resizeColumn(column.header)}
          onPointerDown={onResizeStart}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            event.preventDefault()
            onResizeBy(event.key === 'ArrowLeft' ? -1 : 1)
          }}
          className="absolute top-0 right-0 z-40 flex h-full w-2 cursor-col-resize touch-none items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden="true" className="h-5 w-px bg-border transition-colors group-hover/th:bg-brand" />
        </button>
      )}
    </th>
  )
}
