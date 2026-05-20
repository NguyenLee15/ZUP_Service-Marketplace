import { Sparkles } from 'lucide-react';

import { CategoryGrid } from '@/app/components/home/CategoryGrid';
import { DeferredRecentlyViewedServices } from '@/app/components/home/DeferredRecentlyViewedServices';
import { FeaturedServices } from '@/app/components/home/FeaturedServices';
import { HeroSection } from '@/app/components/home/HeroSection';
import { HowItWorks } from '@/app/components/home/HowItWorks';
import { CustomerFooter } from '@/components/layout/CustomerFooter';
import { HomeHeader } from '@/components/layout/HomeHeader';
import type { Service } from '@/types';

export const revalidate = 60;

type BackendResponse<T> = {
  data?: T;
  success?: boolean;
};

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getBackendUrl(path: string, params?: Record<string, string | number>) {
  const url = new URL(path, BACKEND_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  return url;
}

async function fetchHomeServices(path: string, params?: Record<string, string | number>) {
  try {
    const response = await fetch(getBackendUrl(path, params), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4_000),
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as BackendResponse<Service[] | { data?: Service[] }>;
    const data = payload.data;

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;

    return [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [featuredServices, sponsoredServices] = await Promise.all([
    fetchHomeServices('/services/search', { limit: 8, sortBy: 'rating' }),
    fetchHomeServices('/services/featured'),
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HomeHeader />

      <main id="main-content" className="flex-1">
        <HeroSection />

        <div className="px-4 md:px-6 py-14 md:py-16 max-w-7xl mx-auto space-y-14 md:space-y-16">
          <CategoryGrid />

          {sponsoredServices.length > 0 && (
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
              <FeaturedServices services={sponsoredServices} isSponsored />
            </section>
          )}

          <DeferredRecentlyViewedServices />

          <FeaturedServices services={featuredServices} />

          <HowItWorks />
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
}
