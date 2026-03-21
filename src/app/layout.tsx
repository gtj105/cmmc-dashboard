import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import DevEasterEgg from '@/components/DevEasterEgg'

const ibmPlexSans = localFont({
  src: [
    { path: './fonts/ibm-plex-sans-light.woff2', weight: '300', style: 'normal' },
    { path: './fonts/ibm-plex-sans-regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-sans-medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ibm-plex-sans-semibold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/ibm-plex-sans-bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

const ibmPlexMono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ibm-plex-mono-semibold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
})

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
<body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} font-sans`}>
        <SessionProviderWrapper>
          <DevEasterEgg />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
