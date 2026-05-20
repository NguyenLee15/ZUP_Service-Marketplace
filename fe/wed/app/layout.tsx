import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Montserrat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import NextTopLoader from 'nextjs-toploader'
import { ClientWidgets } from '@/components/client-widgets'

const montserrat = Montserrat({
  subsets: ['vietnamese', 'latin', 'latin-ext'],
  variable: '--font-montserrat',
  display: 'swap',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'HomeService - Tìm Dịch Vụ Tại Nhà Nhanh Chóng',
  description: 'Nền tảng kết nối thợ gia đình, vệ sinh, sửa chữa, điện nước uy tín và nhanh chóng nhất. Giải pháp công nghệ thông minh cho mọi nhà.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'HomeService - Nền Tảng Dịch Vụ Tại Nhà Hàng Đầu',
    description: 'Khám phá hàng ngàn dịch vụ gia đình chất lượng, uy tín với sự hỗ trợ của AI.',
    url: 'https://homeservice.vn',
    siteName: 'HomeService',
    images: [
      {
        url: '/images/hero_bg.png',
        width: 1200,
        height: 630,
        alt: 'HomeService Hero Banner',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HomeService - Tìm Dịch Vụ Nhanh Chóng',
    description: 'Giải quyết mọi sự cố gia đình chỉ với 3 thao tác đơn giản.',
    images: ['/images/hero_bg.png'],
  },
  other: {
    'theme-color': '#ffffff',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1700] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Bỏ qua đến nội dung chính
          </a>
          <NextTopLoader
            color="#2563eb"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #2563eb,0 0 5px #2563eb"
            zIndex={1600}
          />
          {children}
          <ClientWidgets />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
