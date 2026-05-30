import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Montserrat } from 'next/font/google'
import './globals.css'
import { ClientWidgets } from '@/components/client-widgets'
import { DeferredTopLoader } from '@/components/navigation/DeferredTopLoader'
import { JsonLd } from '@/components/seo/JsonLd'
import { headers } from 'next/headers'


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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://service-marketplace-gold.vercel.app'),
  referrer: 'strict-origin-when-cross-origin',
  title: 'Zup - Tìm Dịch Vụ Tại Nhà Nhanh Chóng',
  description: 'Nền tảng kết nối thợ gia đình, vệ sinh, sửa chữa, điện nước uy tín và nhanh chóng nhất. Giải pháp công nghệ thông minh cho mọi nhà.',
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://service-marketplace-gold.vercel.app/',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Zup - Nền Tảng Dịch Vụ Tại Nhà Hàng Đầu',
    description: 'Khám phá hàng ngàn dịch vụ gia đình chất lượng, uy tín với sự hỗ trợ của AI.',
    url: 'https://service-marketplace-gold.vercel.app/',
    siteName: 'Zup',
    images: [
      {
        url: 'https://service-marketplace-gold.vercel.app/images/hero_bg.png',
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
    title: 'Zup - Tìm Dịch Vụ Nhanh Chóng',
    description: 'Giải quyết mọi sự cố gia đình chỉ với 3 thao tác đơn giản.',
    images: ['https://service-marketplace-gold.vercel.app/images/hero_bg.png'],
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
      '@id': 'https://service-marketplace-gold.vercel.app/#organization',
      'name': 'Zup',
      'url': 'https://service-marketplace-gold.vercel.app/',
      'logo': {
        '@type': 'ImageObject',
        '@id': 'https://service-marketplace-gold.vercel.app/#logo',
        'url': 'https://service-marketplace-gold.vercel.app/icon.svg',
        'contentUrl': 'https://service-marketplace-gold.vercel.app/icon.svg',
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
      'sameAs': [
        'https://www.facebook.com/Nguyenlee150804',
        'https://zalo.me/0901234567',
        'https://youtube.com/@zupvn',
        'https://tiktok.com/@zup.vn',
        'https://twitter.com/zupvn'
      ]
    },
    {
      '@type': 'WebSite',
      '@id': 'https://service-marketplace-gold.vercel.app/#website',
      'name': 'Zup',
      'url': 'https://service-marketplace-gold.vercel.app/',
      'publisher': {
        '@id': 'https://service-marketplace-gold.vercel.app/#organization'
      },
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://service-marketplace-gold.vercel.app/services?keyword={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://service-marketplace-gold.vercel.app/#breadcrumb',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Trang chủ',
          'item': 'https://service-marketplace-gold.vercel.app/'
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Dịch vụ',
          'item': 'https://service-marketplace-gold.vercel.app/services'
        }
      ]
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://service-marketplace-gold.vercel.app/#faq',
      'publisher': {
        '@id': 'https://service-marketplace-gold.vercel.app/#organization'
      },
      'author': {
        '@type': 'Person',
        'name': 'Lê Hoàng Nguyễn',
        'jobTitle': 'Chief Quality Officer',
        'worksFor': {
          '@id': 'https://service-marketplace-gold.vercel.app/#organization'
        }
      },
      'datePublished': '2026-05-15T08:00:00+07:00',
      'dateModified': '2026-05-28T21:00:00+07:00',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'Làm sao để tôi đặt lịch dịch vụ?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Bạn chỉ cần tìm kiếm dịch vụ mong muốn, chọn thợ phù hợp, điền thông tin địa chỉ và thời gian. Sau khi nhấn xác nhận, thợ sẽ liên hệ lại để chốt lịch.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Tôi có mất phí khi hủy lịch không?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Việc hủy lịch là hoàn toàn miễn phí nếu bạn thực hiện trước 2 giờ so với thời gian hẹn. Sau thời gian đó có thể phát sinh phí di chuyển cho thợ.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Làm sao để đảm bảo an toàn khi thợ đến nhà?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Tất cả thợ đều được định danh (KYC) và có hồ sơ lý lịch rõ ràng. Bạn cũng có thể theo dõi trạng thái thợ đang di chuyển trên ứng dụng.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Nếu tôi không hài lòng với dịch vụ thì sao?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Bạn có thể gửi khiếu nại ngay trong mục quản lý đơn hàng. Chúng tôi sẽ tạm giữ tiền thanh toán và giải quyết thỏa đáng cho bạn.'
          }
        }
      ]
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
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; frame-src 'self' https:;"
        />
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

