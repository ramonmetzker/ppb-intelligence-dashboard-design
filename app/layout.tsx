import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Space_Grotesk } from 'next/font/google'
import { BootProvider } from '@/components/app/boot'
import { RouteProgress } from '@/components/app/route-progress'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'PPB Intelligence | Scenario simulation for PPB compliance',
  description:
    'See where PPB stands today, how the year will close, and simulate AI scenarios that show exactly what must change to comply.',
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#e5eaf4',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
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
