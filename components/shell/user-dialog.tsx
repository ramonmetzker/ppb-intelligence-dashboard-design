'use client'

import { useState } from 'react'
import {
  ArrowSquareOut,
  Bell,
  Check,
  LockSimple,
  PaintBrush,
  SignOut,
  SlidersHorizontal,
  UserCircle,
} from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { usePreferences } from '@/components/shell/preferences-provider'
import { LANGUAGES, THEMES } from '@/lib/preferences'
import { cn } from '@/lib/utils'

const MANAGEMENT_PORTAL_URL = 'http://seda-mgmt.secmesseda.sdspaas.io/'

type SectionId = 'profile' | 'preferences' | 'notifications' | 'appearance'

export function UserDialog() {
  const {
    t,
    user,
    theme,
    language,
    knoxAlerts,
    setTheme,
    setLanguage,
    setKnoxAlerts,
    userDialogOpen,
    setUserDialogOpen,
  } = usePreferences()

  const copy = t.user
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState(false)

  const sections: {
    id: SectionId
    label: string
    description: string
    icon: typeof UserCircle
  }[] = [
    { id: 'profile', label: copy.profile, description: copy.profileDescription, icon: UserCircle },
    {
      id: 'preferences',
      label: copy.sections.preferences,
      description: copy.sectionDescriptions.preferences,
      icon: SlidersHorizontal,
    },
    {
      id: 'notifications',
      label: copy.sections.notifications,
      description: copy.sectionDescriptions.notifications,
      icon: Bell,
    },
    {
      id: 'appearance',
      label: copy.sections.appearance,
      description: copy.sectionDescriptions.appearance,
      icon: PaintBrush,
    },
  ]

  const active = sections.find((section) => section.id === activeSection) ?? sections[0]

  async function handleSignOut() {
    setSigningOut(true)
    setSignOutError(false)
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Sign out failed')
      window.location.assign('/signed-out')
    } catch {
      setSigningOut(false)
      setSignOutError(true)
    }
  }

  return (
    <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[860px]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 pr-12 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="font-display flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-[14px] font-semibold text-primary-foreground"
            >
              {user.initials}
            </span>
            <div className="min-w-0">
              <DialogTitle className="font-display truncate text-[15px] font-semibold tracking-tight">
                {copy.title}
              </DialogTitle>
              <DialogDescription className="mt-0.5 max-w-[560px] text-[13px] leading-5 text-pretty">
                {copy.description}
              </DialogDescription>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav
            aria-label={copy.settingsNavigation}
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-muted/25 p-2 sm:w-[190px] sm:flex-col sm:gap-1 sm:overflow-visible sm:border-r sm:border-b-0 sm:p-3"
          >
            {sections.map((section) => {
              const Icon = section.icon
              const selected = activeSection === section.id
              return (
                <button
                  key={section.id}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex min-w-[132px] items-center gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring sm:min-w-0',
                    selected
                      ? 'bg-brand-soft text-brand-deep'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <Icon size={16} weight={selected ? 'fill' : 'regular'} aria-hidden="true" />
                  <span className="truncate text-[12.5px] font-medium">{section.label}</span>
                </button>
              )
            })}
          </nav>

          <main className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="font-display text-[19px] font-semibold tracking-tight text-foreground">
                {active.label}
              </h2>
              <p className="mt-1 max-w-[600px] text-[13px] leading-5 text-pretty text-muted-foreground">
                {active.description}
              </p>
            </div>

            {activeSection === 'profile' && (
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)]">
                <section aria-labelledby="user-profile" className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-start gap-2.5 border-b border-border pb-3">
                    <LockSimple size={17} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0">
                      <h3 id="user-profile" className="text-[14px] font-semibold text-foreground">
                        {copy.profile}
                      </h3>
                      <p className="mt-0.5 text-[12.5px] leading-5 text-pretty text-muted-foreground">
                        {copy.readOnly}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-4 divide-y divide-border rounded-md border border-border bg-muted/40">
                    <ProfileRow label={copy.fullName} value={user.fullName} />
                    <ProfileRow label={copy.knoxId} value={user.knoxId} mono />
                    <ProfileRow label={copy.department} value={user.department} />
                  </dl>
                </section>

                <section className="flex flex-col justify-between rounded-lg border border-border bg-muted/35 p-4">
                  <div>
                    <p className="eyebrow">{copy.portalTitle}</p>
                    <p className="mt-2 text-[13px] font-medium text-foreground">{copy.portalDescription}</p>
                    <p className="mt-1.5 text-[12px] leading-5 text-muted-foreground">
                      {copy.portalHint}
                    </p>
                  </div>
                  <a
                    href={MANAGEMENT_PORTAL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-brand-deep hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {copy.portalLink}
                    <ArrowSquareOut size={14} aria-hidden="true" />
                  </a>
                </section>
              </div>
            )}

            {activeSection === 'preferences' && (
              <section aria-labelledby="user-preferences" className="grid gap-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 id="user-preferences" className="eyebrow">
                    {copy.languageTitle}
                  </h3>
                  <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
                    {copy.languageDescription}
                  </p>
                  <div
                    role="radiogroup"
                    aria-labelledby="user-preferences"
                    className="mt-4 grid grid-cols-3 gap-2"
                  >
                    {LANGUAGES.map((option) => {
                      const selected = language === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          lang={option.id}
                          aria-checked={selected}
                          onClick={() => setLanguage(option.id)}
                          className={cn(
                            'flex h-14 flex-col items-start justify-center gap-0.5 rounded-md border bg-card px-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                            selected
                              ? 'border-brand bg-brand-soft/50 ring-1 ring-brand'
                              : 'border-border hover:border-input',
                          )}
                        >
                          <span className="flex w-full items-center justify-between">
                            <span className="tnum text-[10px] font-semibold tracking-[0.08em] text-muted-foreground">
                              {option.code}
                            </span>
                            {selected && (
                              <Check size={12} weight="bold" className="text-brand" aria-hidden="true" />
                            )}
                          </span>
                          <span className="w-full truncate text-[12px] font-medium text-foreground">
                            {option.native}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'notifications' && (
              <section aria-labelledby="notification-preferences" className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 id="notification-preferences" className="text-[13px] font-medium text-foreground">
                      {copy.knoxTitle}
                    </h3>
                    <p className="mt-1 max-w-[520px] text-[12px] leading-5 text-pretty text-muted-foreground">
                      {copy.knoxDescription}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'w-16 text-right text-[11.5px] font-medium',
                        knoxAlerts ? 'text-brand' : 'text-muted-foreground',
                      )}
                    >
                      {knoxAlerts ? copy.on : copy.off}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={knoxAlerts}
                      aria-labelledby="notification-preferences"
                      onClick={() => setKnoxAlerts(!knoxAlerts)}
                      className={cn(
                        'relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        knoxAlerts ? 'bg-brand' : 'bg-input',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute top-0.5 left-0.5 size-4 rounded-full bg-card shadow-xs transition-transform',
                          knoxAlerts && 'translate-x-4',
                        )}
                      />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'appearance' && (
              <section aria-labelledby="appearance-preferences" className="rounded-lg border border-border bg-card p-4">
                <h3 id="appearance-preferences" className="eyebrow">
                  {copy.themeTitle}
                </h3>
                <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
                  {copy.themeDescription}
                </p>
                <div role="radiogroup" aria-labelledby="appearance-preferences" className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                  {THEMES.map((option) => {
                    const selected = theme === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setTheme(option.id)}
                        className={cn(
                          'group flex flex-col items-center gap-1.5 rounded-md border bg-card p-1.5 pb-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                          selected ? 'border-brand ring-1 ring-brand' : 'border-border hover:border-input',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="relative flex h-12 w-full overflow-hidden rounded-[3px]"
                          style={{ background: option.swatch.soft }}
                        >
                          <span className="w-1/3" style={{ background: option.swatch.sidebar }} />
                          <span className="flex flex-1 flex-col justify-end gap-0.5 p-1">
                            <span className="h-1.5 w-full rounded-[1px]" style={{ background: option.swatch.brand }} />
                            <span className="h-1.5 w-2/3 rounded-[1px]" style={{ background: option.swatch.deep }} />
                          </span>
                          {selected && (
                            <span
                              className="absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full text-primary-foreground"
                              style={{ background: option.swatch.brand }}
                            >
                              <Check size={9} weight="bold" />
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            'w-full truncate text-center text-[11px] font-medium',
                            selected ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {copy.themes[option.id]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}
          </main>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-border bg-muted/40 px-5 py-3 sm:px-6">
          <p
            role="status"
            className={cn(
              'min-w-0 text-[12px] text-pretty',
              signOutError ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {signOutError ? copy.signOutFailed : copy.signOutHint}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60"
          >
            <SignOut size={16} aria-hidden="true" />
            {signingOut ? copy.signingOut : copy.signOut}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}

function ProfileRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 py-2.5">
      <dt className="shrink-0 text-[13px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'min-w-0 text-right text-[13.5px] font-medium text-pretty text-foreground',
          mono && 'tnum',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
