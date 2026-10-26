'use client'

import { useState } from 'react'
import { Check, LockSimple, SignOut } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { usePreferences } from '@/components/shell/preferences-provider'
import { LANGUAGES, THEMES } from '@/lib/preferences'
import { cn } from '@/lib/utils'

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
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState(false)

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
      <DialogContent className="top-[7vh] flex max-h-[86vh] translate-y-0 flex-col gap-0 p-0 sm:max-w-[480px]">
        <header className="flex items-center gap-3 border-b border-border px-5 pt-5 pb-4 pr-12">
          <span
            aria-hidden="true"
            className="font-display flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-[14px] font-semibold text-white"
          >
            {user.initials}
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-display truncate text-[15px] font-semibold tracking-tight">
              {copy.title}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-[12px] leading-snug text-pretty">
              {copy.description}
            </DialogDescription>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <section aria-labelledby="user-profile" className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <h3 id="user-profile" className="eyebrow">
                {copy.profile}
              </h3>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <LockSimple size={12} aria-hidden="true" />
                {copy.readOnly}
              </p>
            </div>
            <dl className="mt-2.5 divide-y divide-border rounded-md border border-border bg-muted/40">
              <ProfileRow label={copy.fullName} value={user.fullName} />
              <ProfileRow label={copy.knoxId} value={user.knoxId} mono />
              <ProfileRow label={copy.department} value={user.department} />
            </dl>
          </section>

          <div className="h-px bg-border" />

          <section aria-labelledby="user-prefs" className="flex flex-col gap-5 px-5 py-4">
            <h3 id="user-prefs" className="eyebrow">
              {copy.preferences}
            </h3>

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p id="knox-label" className="text-[13px] font-medium text-foreground">
                  {copy.knoxTitle}
                </p>
                <p id="knox-desc" className="mt-0.5 text-[12px] text-pretty text-muted-foreground">
                  {copy.knoxDescription}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    'w-14 text-right text-[11.5px] font-medium',
                    knoxAlerts ? 'text-brand' : 'text-muted-foreground',
                  )}
                >
                  {knoxAlerts ? copy.on : copy.off}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={knoxAlerts}
                  aria-labelledby="knox-label"
                  aria-describedby="knox-desc"
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

            <div>
              <p id="theme-label" className="text-[13px] font-medium text-foreground">
                {copy.themeTitle}
              </p>
              <p className="mt-0.5 text-[12px] text-pretty text-muted-foreground">
                {copy.themeDescription}
              </p>
              <div
                role="radiogroup"
                aria-labelledby="theme-label"
                className="mt-2.5 grid grid-cols-5 gap-2"
              >
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
                        selected
                          ? 'border-brand ring-1 ring-brand'
                          : 'border-border hover:border-input',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="relative flex h-10 w-full overflow-hidden rounded-[3px]"
                        style={{ background: option.swatch.soft }}
                      >
                        <span className="w-1/3" style={{ background: option.swatch.sidebar }} />
                        <span className="flex flex-1 flex-col justify-end gap-0.5 p-1">
                          <span
                            className="h-1.5 w-full rounded-[1px]"
                            style={{ background: option.swatch.brand }}
                          />
                          <span
                            className="h-1.5 w-2/3 rounded-[1px]"
                            style={{ background: option.swatch.deep }}
                          />
                        </span>
                        {selected && (
                          <span
                            className="absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full text-white"
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
            </div>

            <div>
              <p id="language-label" className="text-[13px] font-medium text-foreground">
                {copy.languageTitle}
              </p>
              <p className="mt-0.5 text-[12px] text-pretty text-muted-foreground">
                {copy.languageDescription}
              </p>
              <div
                role="radiogroup"
                aria-labelledby="language-label"
                className="mt-2.5 grid grid-cols-3 gap-2"
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
                        'flex h-12 flex-col items-start justify-center gap-0.5 rounded-md border bg-card px-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        selected
                          ? 'border-brand bg-brand-soft/50 ring-1 ring-brand'
                          : 'border-border hover:border-input',
                      )}
                    >
                      <span className="flex w-full items-center justify-between">
                        <span className="tnum text-[10px] font-semibold tracking-[0.08em] text-muted-foreground">
                          {option.code}
                        </span>
                        {selected && <Check size={12} weight="bold" className="text-brand" aria-hidden="true" />}
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
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-border bg-muted/40 px-5 py-3">
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
      <dt className="shrink-0 text-[12px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'min-w-0 text-right text-[13px] font-medium text-pretty text-foreground',
          mono && 'tnum',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
