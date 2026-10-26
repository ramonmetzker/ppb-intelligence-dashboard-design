import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { SignOut } from '@phosphor-icons/react/dist/ssr'
import { DICTIONARIES } from '@/lib/i18n'
import { readPreferences } from '@/lib/preferences'

export const metadata: Metadata = {
  title: 'Signed out | PPB Intelligence',
  robots: { index: false },
}

export default async function SignedOutPage() {
  const { language } = readPreferences(await cookies())
  const copy = DICTIONARIES[language].user

  return (
    <main className="flex min-h-dvh items-center justify-center bg-shell p-6">
      <section className="w-full max-w-[400px] rounded-lg border border-border bg-card p-8 text-center shadow-xs">
        <span
          aria-hidden="true"
          className="mx-auto flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand"
        >
          <SignOut size={20} />
        </span>
        <h1 className="font-display mt-4 text-[18px] font-semibold tracking-tight text-balance text-foreground">
          {copy.signedOutTitle}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-pretty text-muted-foreground">
          {copy.signedOutDescription}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {copy.signInAgain}
        </Link>
      </section>
    </main>
  )
}
