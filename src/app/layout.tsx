import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CMMC Dashboard',
  description: 'CMMC Level 2 Compliance Tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
