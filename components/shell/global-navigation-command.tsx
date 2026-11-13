'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Command as CommandIcon } from '@phosphor-icons/react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { usePreferences } from '@/components/shell/preferences-provider'
import { NAV_GROUPS } from '@/components/shell/navigation'

export function GlobalNavigationCommand() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { t } = usePreferences()

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const navigateTo = (href: string) => {
    setOpen(false)
    if (href !== pathname) router.push(href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search pages. Press Control K or Command K."
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        className="hidden items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring xl:flex"
      >
        <CommandIcon size={13} aria-hidden="true" />
        <span className="sr-only">Search pages</span>
        <kbd className="rounded border border-sidebar-border bg-sidebar-accent/60 px-1.5 py-0.5 font-mono text-[10px] leading-none text-sidebar-foreground/70">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search pages"
        description="Navigate to a page in the application."
        className="max-w-xl"
      >
        <Command>
          <CommandInput placeholder="Search pages..." />
          <CommandList>
            <CommandEmpty>No pages found.</CommandEmpty>
            {NAV_GROUPS.map((group) => (
              <CommandGroup key={group.label} heading={t.nav[group.label]}>
                {group.items.map(({ label, href, icon: NavIcon }) => (
                  <CommandItem
                    key={href}
                    value={`${t.nav[label]} ${t.nav[group.label]} ${href}`}
                    onSelect={() => navigateTo(href)}
                    className="gap-3"
                  >
                    <NavIcon size={17} aria-hidden="true" />
                    <span>{t.nav[label]}</span>
                    {href === pathname && (
                      <span className="ml-auto text-[10px] font-medium text-brand">Current</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
