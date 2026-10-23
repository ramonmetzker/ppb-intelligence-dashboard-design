import { ArrowsClockwise, Bell, CaretRight } from '@phosphor-icons/react/dist/ssr'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur-sm">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <li>SEDA-M</li>
          <li aria-hidden="true">
            <CaretRight size={11} />
          </li>
          <li>MX</li>
          <li aria-hidden="true">
            <CaretRight size={11} />
          </li>
          <li aria-current="page" className="font-medium text-foreground">
            HHP
          </li>
        </ol>
      </nav>

      <div className="flex items-center gap-1">
        <p className="tnum mr-3 text-[12px] text-muted-foreground">
          Updated Oct 06, 08:42
        </p>
        <button
          type="button"
          aria-label="Sync status: up to date"
          className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowsClockwise size={17} aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-success"
          />
        </button>
        <button
          type="button"
          aria-label="Notifications, 3 unread"
          className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell size={17} aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand"
          />
        </button>
        <Avatar size="sm" className="ml-2">
          <AvatarFallback className="bg-graphite text-[10px] font-medium text-white">
            RA
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
