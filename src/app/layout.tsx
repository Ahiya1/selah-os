import React from 'react'
import type { Metadata, Viewport } from 'next'
import '@/app/globals.css'
import { Nav } from '@/components/nav'

export const metadata: Metadata = {
  title: 'SelahOS',
  description: 'Quiet instrument panel for the ground layer of life.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Nav />
      </body>
    </html>
  )
}
