import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'OSCaller - Emergency Home Services in Minutes',
  description: 'Get emergency plumbing, electrical, HVAC, and locksmith help dispatched to your door in minutes. AI-powered, pre-authorized, and tracked in real-time.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/symbol-green.svg', type: 'image/svg+xml' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#8FB34A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload the landing background so there's no white flash */}
        <link rel="preload" href="/bg1.webp" as="image" />
      </head>
      <body className="font-sans antialiased bg-white">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0F172A',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: 500,
            },
          }}
          richColors
        />
        <Analytics />
      </body>
    </html>
  )
}

