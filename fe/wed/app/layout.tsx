import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Montserrat } from 'next/font/google'
import './globals.css'
import { ClientWidgets } from '@/components/client-widgets'
import { DeferredTopLoader } from '@/components/navigation/DeferredTopLoader'
import { JsonLd } from '@/components/seo/JsonLd'
import { headers } from 'next/headers'
import { homeFaqs } from './components/home/homeFaqContent'

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const absoluteUrl = (path = '/') => `${appUrl}${path.startsWith('/') ? path : `/${path}`}`;

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
  metadataBase: new URL(appUrl),
  referrer: 'strict-origin-when-cross-origin',
  title: 'Zup - Tìm Và Đặt Dịch Vụ Tại Nhà',
  description: 'Zup giúp bạn tìm, đặt lịch và theo dõi dịch vụ tại nhà với thông tin thợ, giá tham khảo và đánh giá rõ ràng.',
  alternates: {
    canonical: absoluteUrl('/'),
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Zup - Đặt Dịch Vụ Tại Nhà Rõ Ràng Hơn',
    description: 'Tìm dịch vụ, mô tả nhu cầu, nhận báo giá và theo dõi tiến độ trong một nơi.',
    url: absoluteUrl('/'),
    siteName: 'Zup',
    images: [
      {
        url: absoluteUrl('/images/hero_bg.png'),
        width: 1200,
        height: 630,
        alt: 'Zup Hero Banner',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zup - Đặt Dịch Vụ Tại Nhà',
    description: 'Tìm dịch vụ tại nhà với thông tin rõ ràng trước khi đặt lịch.',
    images: [absoluteUrl('/images/hero_bg.png')],
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

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': absoluteUrl('/#organization'),
      'name': 'Zup',
      'url': absoluteUrl('/'),
      'logo': {
        '@type': 'ImageObject',
        '@id': absoluteUrl('/#logo'),
        'url': absoluteUrl('/icon.svg'),
        'contentUrl': absoluteUrl('/icon.svg'),
        'caption': 'Zup'
      },
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+84-123-456-789',
        'contactType': 'customer service',
        'areaServed': 'VN',
        'availableLanguage': 'Vietnamese'
      },
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': '123 Đường Nguyễn Văn Linh, Quận 7',
        'addressLocality': 'TP. Hồ Chí Minh',
        'addressRegion': 'Hồ Chí Minh',
        'postalCode': '70000',
        'addressCountry': 'VN'
      },
      'sameAs': []
    },
    {
      '@type': 'WebSite',
      '@id': absoluteUrl('/#website'),
      'name': 'Zup',
      'url': absoluteUrl('/'),
      'publisher': {
        '@id': absoluteUrl('/#organization')
      },
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': absoluteUrl('/services?keyword={search_term_string}')
        },
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@type': 'BreadcrumbList',
      '@id': absoluteUrl('/#breadcrumb'),
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Trang chủ',
          'item': absoluteUrl('/')
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Dịch vụ',
          'item': absoluteUrl('/services')
        }
      ]
    },
    {
      '@type': 'FAQPage',
      '@id': absoluteUrl('/#faq'),
      'publisher': {
        '@id': absoluteUrl('/#organization')
      },
      'author': {
        '@type': 'Organization',
        'name': 'Zup',
        'url': absoluteUrl('/')
      },
      'datePublished': '2026-05-15T08:00:00+07:00',
      'dateModified': '2026-05-28T21:00:00+07:00',
      'mainEntity': homeFaqs.map((faq) => ({
        '@type': 'Question',
        'name': faq.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.a
        }
      }))
    }
  ]
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || undefined;

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
      </head>
      <body className={`${montserrat.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        <JsonLd data={jsonLdData} nonce={nonce} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1700] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Bỏ qua đến nội dung chính
        </a>
        <DeferredTopLoader />
        {children}
        <ClientWidgets />
      </body>
    </html>
  )
}

