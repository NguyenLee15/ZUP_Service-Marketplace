import Link from 'next/link';
import { 
  Wrench, Home as HomeIcon, Heart, Briefcase, Palette, 
  Smartphone, Utensils, BookOpen, Baby, Dog, Truck 
} from 'lucide-react';

import type { Category } from '@/types';

export function CategoryGrid({ categories = [] }: { categories?: Category[] }) {
  const getCategoryIconAndHint = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('sửa chữa') || lower.includes('kỹ thuật')) return { icon: Wrench, hint: 'Điện nước, thiết bị' };
    if (lower.includes('vệ sinh') || lower.includes('nhà cửa')) return { icon: HomeIcon, hint: 'Nhà cửa, máy lạnh' };
    if (lower.includes('làm đẹp') || lower.includes('sức khỏe')) return { icon: Heart, hint: 'Chăm sóc tại nhà' };
    if (lower.includes('tư vấn')) return { icon: Briefcase, hint: 'Trao đổi theo nhu cầu' };
    if (lower.includes('thiết kế')) return { icon: Palette, hint: 'Sáng tạo, nội dung' };
    if (lower.includes('công nghệ')) return { icon: Smartphone, hint: 'Thiết bị, phần mềm' };
    if (lower.includes('nấu ăn') || lower.includes('sự kiện')) return { icon: Utensils, hint: 'Bữa ăn, sự kiện' };
    if (lower.includes('giáo dục')) return { icon: BookOpen, hint: 'Học tập, kỹ năng' };
    if (lower.includes('mẹ & bé') || lower.includes('mẹ và bé')) return { icon: Baby, hint: 'Chăm sóc trẻ em' };
    if (lower.includes('thú cưng')) return { icon: Dog, hint: 'Chăm sóc, dắt chó' };
    if (lower.includes('xe cộ') || lower.includes('vận chuyển')) return { icon: Truck, hint: 'Cứu hộ, chuyển đồ' };
    return { icon: Wrench, hint: 'Dịch vụ tiện ích' };
  };

  // The backend no longer provides level or parentId, so all categories are top-level
  // Display exactly 8 categories and arrange in a 4-column grid as requested
  const displayCategories = categories.slice(0, 8).map((cat) => {
    const { icon, hint } = getCategoryIconAndHint(cat.name);
    return { icon, label: cat.name, hint, categoryId: cat.id };
  });

  if (displayCategories.length === 0) return null;

  return (
    <section className="relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
          <div className="max-w-3xl">
            <h2 id="danh-muc-dich-vu" className="text-xl md:text-2xl font-bold brand-heading mb-1.5 leading-tight text-balance">
              Bạn cần trợ giúp gì <br />
              <span className="text-action-blue">ngay hôm nay?</span>
            </h2>
            <p className="text-slate-blue text-sm font-medium leading-relaxed max-w-2xl">
              Chọn nhanh nhóm dịch vụ phổ biến để xem thợ phù hợp, giá tham khảo và đánh giá từ khách hàng.
            </p>
          </div>
          <Link href="/services" prefetch={false} className="text-glacier-blue font-bold text-sm inline-flex items-center justify-center gap-2 group px-3.5 py-2 bg-pale-gray rounded-lg hover:bg-action-blue hover:text-white transition-[background-color,color,box-shadow] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue md:shrink-0">
            Khám phá tất cả dịch vụ
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
 
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
          {displayCategories.map((cat, idx) => {
            const IconComponent = cat.icon;
            const isFeatured = idx === 0;

            return (
              <Link
                key={cat.categoryId || idx}
                href={`/services?categoryIds=${cat.categoryId}`}
                prefetch={false}
                aria-label={`Xem dịch vụ ${cat.label}`}
                className="group relative rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-3 flex items-center gap-3 transition-all duration-150 min-h-[76px] md:min-h-[84px] cursor-pointer hover:border-sky-500/40 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 transition-colors duration-150 group-hover:bg-sky-600 group-hover:text-white shrink-0">
                  <IconComponent className="w-5 h-5 transition-transform duration-150 group-hover:scale-105" />
                </div>
                <div className="min-w-0 text-left">
                  {isFeatured && (
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 leading-none mb-1">
                      Phổ biến
                    </span>
                  )}
                  <h3 className="font-sans font-bold text-slate-900 dark:text-slate-100 text-sm mb-0.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
                    {cat.label}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                    {cat.hint}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
