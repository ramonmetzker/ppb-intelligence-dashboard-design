import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Space_Grotesk } from 'next/font/google'
import { cookies } from 'next/headers'
import { BootProvider } from '@/components/app/boot'
import { THEMES, readPreferences } from '@/lib/preferences'
import { RouteProgress } from '@/components/app/route-progress'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'PPB | Scenario simulation for PPB compliance',
  description:
    'See where PPB stands today, how the year will close, and simulate AI scenarios that show exactly what must change to comply.',
  icons: { icon: '/icon.svg' },
}

export async function generateViewport(): Promise<Viewport> {
  const { theme } = readPreferences(await cookies())
  return {
    colorScheme: 'light',
    themeColor: THEMES.find((option) => option.id === theme)?.chrome ?? '#ebebed',
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { theme, language } = readPreferences(await cookies())

  return (
    <html
      lang={language}
      data-theme={theme}
      className={`${geist.variable} ${spaceGrotesk.variable} bg-shell`}
    >
      <body className="antialiased">
        <RouteProgress>
          <BootProvider>{children}</BootProvider>
        </RouteProgress>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
