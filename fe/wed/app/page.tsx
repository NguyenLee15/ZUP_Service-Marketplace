import React, { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { headers } from "next/headers";

import { CategoryGrid } from "@/app/components/home/CategoryGrid";
import { DeferredRecentlyViewedServices } from "@/app/components/home/DeferredRecentlyViewedServices";
import { FeaturedServices } from "@/app/components/home/FeaturedServices";
import { HeroSection } from "@/app/components/home/HeroSection";
import { HowItWorks } from "@/app/components/home/HowItWorks";
import {
  ServicesListSkeleton,
} from "@/app/components/home/HomeSkeleton";
import { GlossarySection } from "@/app/components/home/GlossarySection";
import { Testimonials } from "@/app/components/home/Testimonials";
import { CustomerFooter } from "@/components/layout/CustomerFooter";

import { HomeHeader } from "@/components/layout/HomeHeader";
import type { Category, Service } from "@/types";

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

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
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

async function fetchHomeServices(
  path: string,
  params?: Record<string, string | number>,
) {
  try {
    const response = await fetch(getBackendUrl(path, params), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as BackendResponse<
      Service[] | { data?: Service[] }
    >;
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
    const response = await fetch(getBackendUrl("/categories/flat"), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8_000),
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

  if (normalizedName.includes("vệ sinh")) {
    return "Các gói vệ sinh được đặt nhiều, có giá tham khảo rõ và thợ đã xác minh.";
  }

  if (normalizedName.includes("sửa") || normalizedName.includes("điện")) {
    return "Nhóm sửa chữa tổng hợp từ các danh mục con, phù hợp khi cần xử lý sự cố tại nhà.";
  }

  if (normalizedName.includes("làm đẹp")) {
    return "Các dịch vụ chăm sóc cá nhân tại nhà, có thông tin thợ, giá và đánh giá để so sánh.";
  }

  if (
    normalizedName.includes("công nghệ") ||
    normalizedName.includes("thiết kế")
  ) {
    return "Dịch vụ kỹ thuật và sáng tạo được gom từ các nhóm con để bạn chọn nhanh.";
  }

  return "Một số dịch vụ đang hoạt động trong nhóm danh mục này để bạn chọn nhanh.";
}

function getCategorySectionActionLabel(categoryName: string) {
  const trimmedName = categoryName.trim();
  return trimmedName.toLowerCase().startsWith("dịch vụ")
    ? `Xem thêm ${trimmedName}`
    : `Xem thêm dịch vụ ${trimmedName}`;
}

async function fetchCategoryServiceSections(categories: Category[]) {
  const candidates = sortHomeCategories(categories).slice(0, 8);

  const sections = [];
  for (const category of candidates) {
    const services = await fetchHomeServices("/services/search", {
      categoryIds: getCategoryTreeIds(category.id, categories).join(","),
      limit: 4,
      sortBy: "rating",
    });

    sections.push({
      category,
      description: getCategorySectionDescription(category.name),
      services,
    });
  }

  return sections
    .filter(
      (section): section is CategoryServiceSection =>
        section.services.length > 0,
    )
    .slice(0, 4);
}

function buildFallbackCategorySections(
  services: Service[],
  existingSections: CategoryServiceSection[],
  categories: Category[],
) {
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
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
    const category = service.category
      ? getRootCategory(service.category)
      : null;
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
    .slice(0, 4);
}

export default async function Home() {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  const [featuredServices, sponsoredServices, categories] = await Promise.all([
    fetchHomeServices("/services/search", { limit: 8, sortBy: "rating" }),
    fetchHomeServices("/services/featured"),
    fetchHomeCategories(),
  ]);
  const fetchedCategorySections =
    await fetchCategoryServiceSections(categories);
  const categorySections =
    fetchedCategorySections.length >= 2
      ? fetchedCategorySections
      : buildFallbackCategorySections(
          featuredServices,
          fetchedCategorySections,
          categories,
        );

  return (
    <div className="aether-page min-h-screen bg-background flex flex-col">
      <HomeHeader />

      <main id="main-content" className="flex-1">
        {/* Next.js 16 / React 19 Compliant JSON-LD Schema.org Metadata - Secure Plaintext Template */}
        <script type="application/ld+json" nonce={nonce}>
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Zup - Nền tảng đặt dịch vụ tại nhà",
            description:
              "Zup giúp khách hàng tìm, đặt lịch và theo dõi dịch vụ tại nhà với thông tin thợ, giá tham khảo và đánh giá rõ ràng.",
            publisher: {
              "@type": "Organization",
              name: "Zup",
              url: APP_URL,
              logo: {
                "@type": "ImageObject",
                url: `${APP_URL}/logo.png`,
              },
            },
            author: {
              "@type": "Organization",
              name: "Zup",
            },
            datePublished: "2026-01-15T08:00:00+07:00",
            dateModified: "2026-05-29T08:00:00+07:00",
          })}
        </script>

        <HeroSection />

        <div className="px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto space-y-10 md:space-y-12">
          {/* TOC nhanh — thanh anchor gọn */}
          <nav id="toc" aria-label="Mục lục trang chủ">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold">
              <li className="flex items-center gap-1.5 text-slate-500 font-black uppercase tracking-wider shrink-0">
                <span className="text-cyan-400">📋</span>
                <span>Nhanh:</span>
              </li>
              <li>
                <a
                  href="#danh-muc-dich-vu"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Danh mục
                </a>
              </li>
              <li>
                <a
                  href="#dich-vu-noi-bat"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Nổi bật
                </a>
              </li>
              <li>
                <a
                  href="#danh-gia-khach-hang"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Đánh giá
                </a>
              </li>
              <li>
                <a
                  href="#quy-trinh-hoat-dong"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Quy trình
                </a>
              </li>
              <li>
                <a
                  href="#giai-dap-truc-tiep"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Hỏi đáp
                </a>
              </li>
            </ul>
          </nav>

          <CategoryGrid categories={categories} />

          {(sponsoredServices.length > 0 || featuredServices.length > 0) && (
            <section className="space-y-7 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2
                      id="dich-vu-noi-bat"
                      className="text-2xl md:text-[38px] font-bold brand-heading leading-tight flex items-center gap-2 text-balance"
                    >
                      <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-action-blue" />
                      Dịch vụ nổi bật
                    </h2>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground font-medium">
                    {sponsoredServices.length > 0 
                      ? "Dịch vụ đang được giới thiệu" 
                      : "Dịch vụ được đánh giá cao nhất"}
                  </p>
                </div>
              </div>
              <FeaturedServices 
                services={sponsoredServices.length > 0 ? sponsoredServices : featuredServices} 
                isSponsored={sponsoredServices.length > 0} 
                hideHeader
              />
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
              actionLabel={getCategorySectionActionLabel(section.category.name)}
            />
          ))}

          <Testimonials />

          <HowItWorks />

          <GlossarySection />
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
}
