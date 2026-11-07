import type { Metadata, Viewport } from 'next';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/800.css';
import '@fontsource/orbitron/900.css';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import { AppProviders } from '@/context/AppProviders';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ToastOverlay } from '@/components/ui/ToastOverlay';

export const metadata: Metadata = {
  title: {
    default: 'PUSH RUSH — Think Fast. Tap Faster. Beat the Clock.',
    template: '%s | PUSH RUSH',
  },
  description:
    'PUSH RUSH is a fast-paced online reaction-speed and brain-training gaming platform with 8 competitive modes, daily challenges, XP progression, and verified global leaderboards.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PUSH RUSH',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050816',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="rush-cyber-bg antialiased flex flex-col min-h-dvh">
        <AppProviders>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ToastOverlay />
        </AppProviders>
      </body>
    </html>
  );
}
