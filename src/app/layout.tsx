import type { Metadata } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Sans } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// IBM Plex Sans — tipografía de la identidad visual "Ámbar equilibrado" (Fase 14)
const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'production'
      ? 'https://abastio.mx'
      : 'http://localhost:3000'
  ),
  title: {
    default: 'Abastio',
    template: '%s · Abastio',
  },
  description:
    'Inteligencia operativa sobre tu ERP para mayoristas y distribuidores mexicanos.',
  applicationName: 'Abastio',
  icons: {
    icon: [
      { url: '/brand/favicon.ico', sizes: 'any' },
      { url: '/brand/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/brand/site.webmanifest',
  openGraph: {
    title: 'Abastio',
    description: 'Inteligencia operativa sobre tu ERP.',
    url: '/',
    siteName: 'Abastio',
    images: [
      {
        url: '/brand/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Abastio — Inteligencia operativa sobre tu ERP',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abastio',
    description: 'Inteligencia operativa sobre tu ERP.',
    images: ['/brand/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={ibmPlex.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlex.variable} antialiased font-sans`}
      >
        {children}
        <Toaster position="top-right" richColors duration={4000} />
      </body>
    </html>
  );
}
