'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { serviceApi } from '@/features/service/services/service.api';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerFooter } from '@/components/layout/CustomerFooter';
import { useServiceStore } from '@/store/service.store';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Components
import { HeroSection } from '@/app/components/home/HeroSection';
import { CategoryGrid } from '@/app/components/home/CategoryGrid';
import { FeaturedServices } from '@/app/components/home/FeaturedServices';
import { HowItWorks } from '@/app/components/home/HowItWorks';
import { Testimonials } from '@/app/components/home/Testimonials';
import { FaqSection } from '@/app/components/home/FaqSection';
import { UnifiedServiceCard } from '@/app/components/services/UnifiedServiceCard';

export default function Home() {
  const router = useRouter();
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [sponsoredServices, setSponsoredServices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Hà Nội');
  const { recentlyViewed, favorites, toggleFavoriteService } = useServiceStore();

  useEffect(() => {
    // Lấy top rating (tuyển chọn)
    serviceApi.search({ limit: 8, sortBy: 'rating' })
      .then(res => setFeaturedServices(res.data.data || []))
      .catch(err => {
        if (err.code === 'ERR_NETWORK') {
          console.warn('Backend is offline. Running in offline UI mode.');
        }
      });
      
    // Lấy featured listings (được tài trợ)
    serviceApi.getFeatured()
      .then(res => setSponsoredServices(res.data.data || []))
      .catch(() => {});
  }, []);

  const buildServicesHref = (keyword?: string) => {
    const params = new URLSearchParams();
    const normalizedKeyword = keyword?.trim() || searchQuery.trim();
    const normalizedLocation = location.trim();

    if (normalizedKeyword) params.set('keyword', normalizedKeyword);
    if (normalizedLocation) params.set('location', normalizedLocation);

    const query = params.toString();
    return query ? `/services?${query}` : '/services';
  };

  const handleHeroSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    router.push(buildServicesHref());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomerHeader />

      <main id="main-content" className="flex-1">
        <HeroSection 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          location={location}
          setLocation={setLocation}
          onSearch={handleHeroSearch}
          onQuickSearch={(keyword) => router.push(buildServicesHref(keyword))}
        />

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
                  <p className="text-sm md:text-base text-muted-foreground font-medium">Đối tác hàng đầu được tài trợ</p>
                </div>
              </div>
              <FeaturedServices services={sponsoredServices} isSponsored />
            </section>
          )}



          {recentlyViewed.length > 0 && (
            <section className="space-y-7 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl md:text-[38px] font-bold brand-heading leading-tight text-balance">Gợi ý dành riêng cho bạn</h2>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground">Dựa trên các dịch vụ bạn đã quan tâm gần đây</p>
                </div>
                <Link href="/services" className="inline-flex text-sm font-bold text-action-blue hover:text-glacier-blue items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue rounded-md">
                  Xem tất cả thợ
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentlyViewed.slice(0, 4).map((service) => (
                  <UnifiedServiceCard
                    key={service.id}
                    service={service}
                    isFavorite={favorites.includes(service.id)}
                    showFavorite
                    showTrustBadges
                    showPrimaryAction
                    useImageCarousel
                    priceMode="estimate"
                    onToggleFavorite={toggleFavoriteService}
                  />
                ))}
              </div>
            </section>
          )}

          <FeaturedServices services={featuredServices} />

          <HowItWorks />

          <Testimonials />

          <FaqSection />
        </div>
      </main>

      <CustomerFooter />


    </div>
  );
}
