import { Sparkles } from 'lucide-react';

import { CategoryGrid } from '@/app/components/home/CategoryGrid';
import { HeroSection } from '@/app/components/home/HeroSection';
import { HowItWorks } from '@/app/components/home/HowItWorks';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import dynamic from 'next/dynamic';

const RecentlyViewedServices = dynamic(
  () => import('@/app/components/home/RecentlyViewedServices').then((mod) => mod.RecentlyViewedServices),
  { ssr: true }
);

const FeaturedServices = dynamic(
  () => import('@/app/components/home/FeaturedServices').then((mod) => mod.FeaturedServices),
  {
    loading: () => (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[4/3] w-full shimmer rounded-[20px]" />
        ))}
      </div>
    ),
    ssr: true,
  }
);

const CustomerFooter = dynamic(
  () => import('@/components/layout/CustomerFooter').then((mod) => mod.CustomerFooter),
  { ssr: true }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomerHeader />

      <main id="main-content" className="flex-1">
        <HeroSection />

        <div className="px-4 md:px-6 py-14 md:py-16 max-w-7xl mx-auto space-y-14 md:space-y-16">
          <CategoryGrid />

          <section className="space-y-7 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-[38px] font-bold brand-heading leading-tight flex items-center gap-2 text-balance">
                    <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-action-blue" />
                    Dịch vụ nổi bật
                  </h2>
                </div>
                <p className="text-sm md:text-base text-muted-foreground font-medium">
                  Đối tác hàng đầu được tài trợ
                </p>
              </div>
            </div>
            <FeaturedServices services={[]} isSponsored />
          </section>

          <RecentlyViewedServices />

          <FeaturedServices services={[]} />

          <HowItWorks />
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
}

