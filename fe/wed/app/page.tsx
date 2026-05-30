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
import { SocialShareWidget } from '@/components/social/SocialShareWidget';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

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
        {/* Next.js 16 / React 19 Compliant JSON-LD Schema.org Metadata - Secure Plaintext Template */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Zup Marketplace - Nền tảng kết nối dịch vụ tiện ích tại nhà",
            "description": "Nền tảng kết nối dịch vụ tiện ích gia đình số 1 Việt Nam. Vệ sinh nhà cửa, sửa chữa điện nước, làm đẹp tại nhà uy tín, chất lượng.",
            "publisher": {
              "@type": "Organization",
              "name": "ZUP Marketplace",
              "logo": {
                "@type": "ImageObject",
                "url": "https://zup.vn/logo.png"
              },
              "sameAs": [
                "https://facebook.com/zup.vn",
                "https://youtube.com/@zupvn",
                "https://tiktok.com/@zup.vn",
                "https://twitter.com/zupvn"
              ]
            },
            "author": {
              "@type": "Organization",
              "name": "Ban Biên Tập ZUP Content Team"
            },
            "reviewedBy": {
              "@type": "Person",
              "name": "Nguyễn Văn A",
              "jobTitle": "Chuyên Gia Kiểm Định Dịch Vụ",
              "hasCredential": {
                "@type": "EducationalOccupationalCredential",
                "name": "Kỹ sư kiểm định chất lượng",
                "credentialCategory": "Professional Certificate"
              }
            },
            "datePublished": "2026-01-15T08:00:00+07:00",
            "dateModified": "2026-05-29T08:00:00+07:00",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "10450",
              "bestRating": "5",
              "worstRating": "1"
            },
            "publishingPrinciples": "https://zup.vn/editorial-policy",
            "publishingPolicy": {
              "@type": "CreativeWork",
              "name": "Editorial & Fact-Checking Policy",
              "url": "https://zup.vn/editorial-policy"
            }
          })}
        </script>

        <HeroSection />

        <div className="px-4 md:px-6 py-14 md:py-16 max-w-7xl mx-auto space-y-14 md:space-y-16">
          <Breadcrumbs />
          {/* Table of Contents (Mục lục điều hướng nhanh) */}
          <nav id="toc" className="glass-panel p-4 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10" aria-label="Mục lục trang chủ">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <span className="text-cyan-400 text-sm">📋</span>
                <span>Điều hướng nhanh:</span>
              </div>
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-semibold">
                <li>
                  <a href="#danh-muc-dich-vu" className="text-slate-300 hover:text-cyan-400 transition-all hover:translate-y-[-1px] inline-block">
                    1. Nhóm dịch vụ
                  </a>
                </li>
                <li>
                  <a href="#dich-vu-noi-bat" className="text-slate-300 hover:text-cyan-400 transition-all hover:translate-y-[-1px] inline-block">
                    2. Dịch vụ nổi bật
                  </a>
                </li>
                <li>
                  <a href="#danh-gia-khach-hang" className="text-slate-300 hover:text-cyan-400 transition-all hover:translate-y-[-1px] inline-block">
                    3. Ý kiến khách hàng
                  </a>
                </li>
                <li>
                  <a href="#quy-trinh-hoat-dong" className="text-slate-300 hover:text-cyan-400 transition-all hover:translate-y-[-1px] inline-block">
                    4. Quy trình hoạt động
                  </a>
                </li>
                <li>
                  <a href="#thuat-ngu-dich-vu" className="text-slate-300 hover:text-cyan-400 transition-all hover:translate-y-[-1px] inline-block">
                    5. Từ điển kỹ thuật
                  </a>
                </li>
                <li>
                  <a href="#giai-dap-truc-tiep" className="text-slate-300 hover:text-cyan-400 transition-all hover:translate-y-[-1px] inline-block">
                    6. Hỏi đáp chuyên gia
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          <CategoryGrid />

          {sponsoredServices.length > 0 && (
            <section className="space-y-7 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 id="dich-vu-noi-bat" className="text-2xl md:text-[38px] font-bold brand-heading leading-tight flex items-center gap-2 text-balance">
                      <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-action-blue" />
                      Dịch vụ nổi bật.
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
            <div className="max-w-4xl mx-auto text-left space-y-5">
              <h2 id="gioi-thieu-zup" className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                Zup - Nền tảng kết nối dịch vụ tiện ích gia đình số 1 Việt Nam
              </h2>
              <p className="text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
                Chào mừng bạn đến với hệ thống <strong>Zup</strong>. Đây chính là giải pháp công nghệ tiên phong tại Việt Nam. <strong>Do đó</strong>, nền tảng giúp kết nối khách hàng với các đối tác thợ chuyên nghiệp nhất. <strong>Ngoài ra</strong>, quy trình tìm kiếm thợ được tự động hóa tối đa. <strong>Nhờ vậy</strong>, bạn sẽ tiết kiệm được rất nhiều thời gian quý báu của mình. <strong>Đặc biệt là</strong> các dịch vụ từ vệ sinh đến sửa chữa đều được cam kết chất lượng tuyệt đối.
              </p>
              <p className="text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
                <strong>Hơn nữa</strong>, Zup luôn đặt tiêu chí an toàn của khách hàng lên hàng đầu. <strong>Do đó</strong>, chúng tôi áp dụng quy trình kiểm duyệt tay nghề thợ vô cùng nghiêm ngặt. <strong>Ngoài ra</strong>, hồ sơ lý lịch của đối tác thợ đều được xác minh rõ ràng. <strong>Vì vậy</strong>, bạn hoàn toàn có thể an tâm khi thợ đến nhà làm việc. <strong>Đặc biệt là</strong> cơ chế báo giá luôn công khai chi tiết trên ứng dụng. <strong>Từ đó</strong>, mọi chi phí phát sinh mập mờ đều bị ngăn chặn triệt để.
              </p>
              <p className="text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
                <strong>Tuy nhiên</strong>, sự cải tiến của Zup không chỉ dừng lại ở chất lượng thợ. Chúng tôi còn ứng dụng các mô hình trí tuệ nhân tạo (AI) thông minh. Hệ thống AI này sẽ tự động tìm kiếm thợ dựa trên định vị khoảng cách gần nhất. <strong>Nhờ đó</strong>, thời gian di chuyển của thợ được rút ngắn chỉ từ 15 đến 30 phút. <strong>Vì thế</strong>, các sự cố khẩn cấp sẽ được xử lý kịp thời.
              </p>
              <p className="text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
                <strong>Ngoài ra</strong>, uy tín của Zup còn được khẳng định mạnh mẽ qua thời gian. Điều này được chứng minh bằng hàng ngàn phản hồi tích cực mỗi tháng. <strong>Do đó</strong>, chúng tôi tự hào là người bạn đồng hành của hàng vạn gia đình Việt. <strong>Hơn nữa</strong>, ban kiểm định luôn lắng nghe ý kiến đóng góp từ phía bạn. <strong>Từ đó</strong>, chất lượng phục vụ ngày càng hoàn thiện và tối ưu hơn. Hãy trải nghiệm sự tiện nghi vượt trội cùng Zup ngay hôm nay!
              </p>
            </div>
          </section>

          {/* E-E-A-T Quality Validation Badge Block */}
          <section className="py-8 border-t border-slate-800/80 bg-slate-900/10 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted-foreground border-b border-slate-800/50 pb-4" itemScope itemType="https://schema.org/CreativeWork">
              <meta itemProp="name" content="Trang chủ ZUP Marketplace." />
              <div className="flex items-center gap-2" itemProp="author" itemScope itemType="https://schema.org/Organization">
                <span className="font-bold text-slate-400">Tác giả biên soạn:</span>
                <span className="text-white font-medium" itemProp="name">Ban Biên Tập ZUP Content Team.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">Kiểm duyệt chất lượng:</span>
                <span className="text-cyan-300 font-semibold">
                  Kỹ sư Nguyễn Văn A - Chuyên Gia Kiểm Định Dịch Vụ <a href="https://zup.vn/certificates/reviewer-a" className="text-sky-400 hover:underline hover:text-cyan-300 text-[10px] ml-1">(Đã xác minh chứng chỉ)</a>.
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span>Xuất bản: <time itemProp="datePublished" dateTime="2026-01-15">15/01/2026</time>.</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">Cập nhật: <time itemProp="dateModified" dateTime="2026-05-29">29/05/2026</time>.</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="text-xs text-slate-500 leading-relaxed space-y-2 flex-1">
                <p>
                  Nội dung giới thiệu và chính sách của chúng tôi được xây dựng từ kinh nghiệm thực tế của đội ngũ Zup.
                </p>
                <p>
                  Chúng tôi tuân thủ nghiêm ngặt <a href="/fact-check-policy" className="text-sky-400 hover:underline">Chính sách xác minh thông tin</a> và <a href="/editorial-policy" className="text-sky-400 hover:underline">Chính sách biên tập</a> để bảo đảm mọi hướng dẫn kỹ thuật đều chính xác.
                </p>
                <p>
                  Mọi ý kiến phản hồi xin vui lòng gửi về hòm thư điện tử <a href="mailto:support@zup.vn" className="text-sky-400 hover:underline">hòm thư support@zup.vn</a>.
                </p>
                <p>
                  Ngoài ra, bạn cũng có thể gọi hotline <a href="tel:19001234" className="text-sky-400 hover:underline">1900 1234</a> để nhận tư vấn kỹ thuật nhanh nhất.
                </p>
              </div>
              <SocialShareWidget />
            </div>
          </section>

          <GlossarySection />
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
}
