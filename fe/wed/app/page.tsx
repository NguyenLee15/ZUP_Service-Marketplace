import React, { Suspense } from 'react';
import { Sparkles } from 'lucide-react';

import { CategoryGrid } from '@/app/components/home/CategoryGrid';
import { DeferredRecentlyViewedServices } from '@/app/components/home/DeferredRecentlyViewedServices';
import { FeaturedServices } from '@/app/components/home/FeaturedServices';
import { HeroSection } from '@/app/components/home/HeroSection';
import { HowItWorks } from '@/app/components/home/HowItWorks';
import { CategoryGridSkeleton, ServicesListSkeleton } from '@/app/components/home/HomeSkeleton';
import { GlossarySection } from '@/app/components/home/GlossarySection';
import { Testimonials } from '@/app/components/home/Testimonials';
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
const HOME_MAIN_CATEGORY_IDS = [3, 1, 4, 8, 9, 10, 11, 12];

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
  const priority = new Map(
    HOME_MAIN_CATEGORY_IDS.map((categoryId, index) => [categoryId, index]),
  );

  return [...categories]
    .filter((category) => !category.parentId || category.level === 1)
    .sort((a, b) => {
      const aPriority = priority.get(a.id) ?? HOME_MAIN_CATEGORY_IDS.length;
      const bPriority = priority.get(b.id) ?? HOME_MAIN_CATEGORY_IDS.length;
      return aPriority - bPriority || a.id - b.id;
    });
}

function getCategoryTreeIds(rootCategoryId: number, categories: Category[]) {
  const childrenByParent = new Map<number, Category[]>();

  categories.forEach((category) => {
    if (!category.parentId) return;
    const siblings = childrenByParent.get(category.parentId) ?? [];
    siblings.push(category);
    childrenByParent.set(category.parentId, siblings);
  });

  const ids = new Set<number>([rootCategoryId]);
  const queue = [rootCategoryId];

  while (queue.length > 0) {
    const parentId = queue.shift();
    if (!parentId) continue;

    const children = childrenByParent.get(parentId) ?? [];
    children.forEach((child) => {
      if (ids.has(child.id)) return;
      ids.add(child.id);
      queue.push(child.id);
    });
  }

  return [...ids];
}

function getCategorySectionDescription(categoryName: string) {
  const normalizedName = categoryName.toLowerCase();

  if (normalizedName.includes('vệ sinh')) {
    return 'Các gói vệ sinh được đặt nhiều, có giá tham khảo rõ và thợ đã xác minh.';
  }

  if (normalizedName.includes('sửa') || normalizedName.includes('điện')) {
    return 'Nhóm sửa chữa tổng hợp từ các danh mục con, phù hợp khi cần xử lý sự cố tại nhà.';
  }

  if (normalizedName.includes('làm đẹp')) {
    return 'Các dịch vụ chăm sóc cá nhân tại nhà, có thông tin thợ, giá và đánh giá để so sánh.';
  }

  if (normalizedName.includes('công nghệ') || normalizedName.includes('thiết kế')) {
    return 'Dịch vụ kỹ thuật và sáng tạo được gom từ các nhóm con để bạn chọn nhanh.';
  }

  return 'Một số dịch vụ đang hoạt động trong nhóm danh mục này để bạn chọn nhanh.';
}

async function fetchCategoryServiceSections(categories: Category[]) {
  const candidates = sortHomeCategories(categories).slice(0, 8);

  const sections = await Promise.all(
    candidates.map(async (category) => {
      const services = await fetchHomeServices('/services/search', {
        categoryIds: getCategoryTreeIds(category.id, categories).join(','),
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
  categories: Category[],
) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const existingCategoryIds = new Set(
    existingSections.map((section) => section.category.id),
  );
  const grouped = new Map<number, CategoryServiceSection>();
  const getRootCategory = (category: Category) => {
    let current = categoryById.get(category.id) ?? category;
    const seen = new Set<number>();

    while (current.parentId && !seen.has(current.parentId)) {
      seen.add(current.id);
      const parent = categoryById.get(current.parentId);
      if (!parent) break;
      current = parent;
    }

    return current;
  };

  services.forEach((service) => {
    const category = service.category ? getRootCategory(service.category) : null;
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
      : buildFallbackCategorySections(featuredServices, fetchedCategorySections, categories);

  return (
    <div className="aether-page min-h-screen bg-background flex flex-col">
      <HomeHeader />

      <main id="main-content" className="flex-1">
        <HeroSection />

        <div className="px-4 md:px-6 py-14 md:py-16 max-w-7xl mx-auto space-y-14 md:space-y-16">
          <Suspense fallback={<CategoryGridSkeleton />}>
            <CategoryGrid />
          </Suspense>

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

          <Suspense fallback={<ServicesListSkeleton />}>
            <DeferredRecentlyViewedServices />
          </Suspense>

           {categorySections.map((section) => (
            <FeaturedServices
              key={section.category.id}
              services={section.services}
              title={section.category.name}
              description={section.description}
              href={`/services?categoryIds=${section.category.id}`}
              actionLabel={`Xem thêm dịch vụ ${section.category.name}`}
            />
          ))}

          <Testimonials />

          <HowItWorks />

          {/* Rich Content Text Block for Text/HTML Ratio Optimization */}
          <section className="py-10 border-t border-slate-800 space-y-6">
            <div className="max-w-4xl mx-auto text-left space-y-4">
              <h2 id="gioi-thieu-zup" className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                Zup - Nền tảng kết nối dịch vụ tiện ích gia đình số 1 Việt Nam
              </h2>
              <p className="text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
                Chào mừng bạn đến với <strong>Zup</strong>. Đây là nền tảng công nghệ tiên phong kết nối khách hàng và thợ chuyên nghiệp. <strong>Do đó</strong>, chúng tôi tự hào mang đến giải pháp toàn diện cho gia đình bận rộn. <strong>Ngoài ra</strong>, các dịch vụ từ vệ sinh đến sửa chữa đều được cam kết chất lượng hàng đầu.
              </p>
              <p className="text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
                <strong>Zup</strong> áp dụng tiêu chuẩn kiểm duyệt đầu vào cực kỳ khắt khe. <strong>Hơn nữa</strong>, mọi đối tác thợ đều phải hoàn thành xác thực thông tin (KYC). <strong>Ngoài ra</strong>, cơ chế báo giá minh bạch giúp ngăn chặn phát sinh chi phí mập mờ. <strong>Vì vậy</strong>, quyền lợi của bạn luôn được bảo vệ tốt nhất.
              </p>
              <p className="text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
                <strong>Tuy nhiên</strong>, Zup không chỉ dừng lại ở đó. Chúng tôi còn đầu tư mạnh mẽ vào ứng dụng trí tuệ nhân tạo (AI). Công nghệ này giúp đề xuất thợ phù hợp theo khoảng cách địa lý. <strong>Do đó</strong>, hãy trải nghiệm sự tiện nghi cùng Zup ngay hôm nay!
              </p>
            </div>
          </section>

          <GlossarySection />
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
}
