import { ArrowsClockwise, Bell, CaretRight } from '@phosphor-icons/react/dist/ssr'

export function TopBar() {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <li>PPB</li>
          <li aria-hidden="true">
            <CaretRight size={10} />
          </li>
          <li>GBM</li>
          <li aria-hidden="true">
            <CaretRight size={10} />
          </li>
          <li aria-current="page" className="font-medium text-foreground">
            HHP
          </li>
        </ol>
      </nav>

      <div className="flex items-center gap-1">
        <p className="tnum mr-2 text-[11.5px] text-muted-foreground">
          Updated Oct 06, 08:42
        </p>
        <button
          type="button"
          aria-label="Sync status: up to date"
          className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <ArrowsClockwise size={15} aria-hidden="true" />
          <span aria-hidden="true" className="absolute top-1 right-1 size-1.5 rounded-[1px] bg-success" />
        </button>
        <button
          type="button"
          aria-label="Notifications, 3 unread"
          className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <Bell size={15} aria-hidden="true" />
          <span aria-hidden="true" className="absolute top-1 right-1 size-1.5 rounded-[1px] bg-brand" />
        </button>
      </div>
    </header>
  )
}
