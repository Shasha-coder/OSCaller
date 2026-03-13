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
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#0d0f12',
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

      </head>
      <body className="font-sans antialiased bg-[#0d0f12]">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(20, 20, 20, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: '#F5F5F5',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
          }}
          richColors
        />
        <Analytics />
      </body>
    </html>
  )
}

