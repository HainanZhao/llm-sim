import './globals.css'
import type { Metadata } from 'next'

export const metadata = {
  title: 'LLM Inference Simulator',
  description: 'GPU Hardware Pipeline Visualization for LLM Inference',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}