import { Sparkles } from 'lucide-react';

import { CategoryGrid } from '@/app/components/home/CategoryGrid';
import { DeferredRecentlyViewedServices } from '@/app/components/home/DeferredRecentlyViewedServices';
import { FeaturedServices } from '@/app/components/home/FeaturedServices';
import { HeroSection } from '@/app/components/home/HeroSection';
import { HowItWorks } from '@/app/components/home/HowItWorks';
import { CustomerFooter } from '@/components/layout/CustomerFooter';
import { HomeHeader } from '@/components/layout/HomeHeader';
import type { Category, Service } from '@/types';

export const revalidate = 60;

type BackendResponse<T> = {
  data?: T;
  success?: boolean;
};

type CategoryServiceSection = {
  category: Category;
  description: string;
  services: Service[];
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

async function fetchHomeCategories() {
  try {
    const response = await fetch(getBackendUrl('/categories/flat'), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4_000),
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as BackendResponse<Category[]>;
    return Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return [];
  }
}

function sortHomeCategories(categories: Category[]) {
  const priorityPatterns = [
    /vệ sinh|don dep|dọn/i,
    /sửa điện|điện nước|sửa chữa/i,
    /thông tắc|thiết bị|máy tính|camera/i,
  ];

  return [...categories]
    .filter((category) => category.parentId)
    .sort((a, b) => {
      const score = (category: Category) => {
        const index = priorityPatterns.findIndex((pattern) =>
          pattern.test(category.name),
        );
        return index === -1 ? priorityPatterns.length : index;
      };

      return score(a) - score(b) || a.id - b.id;
    });
}

function getCategorySectionDescription(categoryName: string) {
  const normalizedName = categoryName.toLowerCase();

  if (normalizedName.includes('vệ sinh')) {
    return 'Các gói vệ sinh được đặt nhiều, có giá tham khảo rõ và thợ đã xác minh.';
  }

  if (normalizedName.includes('sửa') || normalizedName.includes('điện')) {
    return 'Nhóm thợ sửa chữa phản hồi nhanh, phù hợp khi cần xử lý sự cố tại nhà.';
  }

  if (normalizedName.includes('thông tắc') || normalizedName.includes('camera') || normalizedName.includes('máy tính')) {
    return 'Dịch vụ kỹ thuật có mô tả, đánh giá và mức giá để bạn so sánh trước khi đặt.';
  }

  return 'Một số dịch vụ đang hoạt động trong danh mục này để bạn chọn nhanh.';
}

async function fetchCategoryServiceSections(categories: Category[]) {
  const candidates = sortHomeCategories(categories).slice(0, 8);

  const sections = await Promise.all(
    candidates.map(async (category) => {
      const services = await fetchHomeServices('/services/search', {
        categoryId: category.id,
        limit: 4,
        sortBy: 'rating',
      });

      return {
        category,
        description: getCategorySectionDescription(category.name),
        services,
      };
    }),
  );

  return sections
    .filter((section): section is CategoryServiceSection => section.services.length > 0)
    .slice(0, 3);
}

function buildFallbackCategorySections(
  services: Service[],
  existingSections: CategoryServiceSection[],
) {
  const existingCategoryIds = new Set(
    existingSections.map((section) => section.category.id),
  );
  const grouped = new Map<number, CategoryServiceSection>();

  services.forEach((service) => {
    const category = service.category;
    if (!category || existingCategoryIds.has(category.id)) return;

    const current = grouped.get(category.id);
    if (current) {
      if (current.services.length < 4) current.services.push(service);
      return;
    }

    grouped.set(category.id, {
      category,
      description: getCategorySectionDescription(category.name),
      services: [service],
    });
  });

  return [...existingSections, ...grouped.values()]
    .filter((section) => section.services.length > 0)
    .slice(0, 3);
}

export default async function Home() {
  const [featuredServices, sponsoredServices, categories] = await Promise.all([
    fetchHomeServices('/services/search', { limit: 8, sortBy: 'rating' }),
    fetchHomeServices('/services/featured'),
    fetchHomeCategories(),
  ]);
  const fetchedCategorySections = await fetchCategoryServiceSections(categories);
  const categorySections =
    fetchedCategorySections.length >= 2
      ? fetchedCategorySections
      : buildFallbackCategorySections(featuredServices, fetchedCategorySections);

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

          {categorySections.map((section) => (
            <FeaturedServices
              key={section.category.id}
              services={section.services}
              title={section.category.name}
              description={section.description}
              href={`/services?categoryIds=${section.category.id}`}
              actionLabel="Xem danh mục"
            />
          ))}

          <HowItWorks />
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
}
