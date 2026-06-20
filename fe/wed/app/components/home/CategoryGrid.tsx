import Link from 'next/link';
import { 
  Wrench, Home as HomeIcon, Heart, Briefcase, Palette, 
  Smartphone, Utensils, BookOpen, Baby, Dog, Truck 
} from 'lucide-react';

import type { Category } from '@/types';

export function CategoryGrid({ categories = [] }: { categories?: Category[] }) {
  const level1Categories = categories.filter((c) => c.level === 1);

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

  const displayCategories = level1Categories.map((cat) => {
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
 
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 md:gap-3">
          {displayCategories.map((cat, idx) => {
            const IconComponent = cat.icon;
            
            // Generate distinctive color configurations for each category tile
            const colorSchemes = [
              { bg: 'group-hover:bg-sky-500/10 border-sky-500/10 text-sky-500', badge: 'Phổ biến' },
              { bg: 'group-hover:bg-teal-500/10 border-teal-500/10 text-teal-500' },
              { bg: 'group-hover:bg-pink-500/10 border-pink-500/10 text-pink-500' },
              { bg: 'group-hover:bg-violet-500/10 border-violet-500/10 text-violet-500' },
              { bg: 'group-hover:bg-emerald-500/10 border-emerald-500/10 text-emerald-500' },
              { bg: 'group-hover:bg-cyan-500/10 border-cyan-500/10 text-cyan-500' },
              { bg: 'group-hover:bg-orange-500/10 border-orange-500/10 text-orange-500' },
              { bg: 'group-hover:bg-amber-500/10 border-amber-500/10 text-amber-500' }
            ];

            const scheme = colorSchemes[idx % colorSchemes.length];
            const isFeatured = cat.categoryId === 3;

            return (
              <Link
                key={idx}
                href={`/services?categoryIds=${cat.categoryId}`}
                prefetch={false}
                aria-label={`Xem dịch vụ ${cat.label}`}
                className={`glass-panel rounded-xl p-3 flex items-center gap-3 group glow-hover transition-all duration-300 min-h-[76px] md:min-h-[84px] cursor-pointer hover:-translate-y-0.5 ${isFeatured ? 'bg-sky-500/[0.06] dark:bg-sky-400/[0.08]' : ''}`}
              >
                <div className={`p-2 bg-slate-100 dark:bg-white/5 rounded-lg transition-all duration-300 shrink-0 ${scheme.bg.split(' ')[0]}`}>
                  <IconComponent className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${scheme.bg.split(' ')[2]}`} />
                </div>
                <div className="min-w-0 text-left">
                  {scheme.badge && (
                    <span className="block text-[9px] font-black uppercase tracking-wide text-sky-600 dark:text-sky-400 leading-none mb-1">
                      {scheme.badge}
                    </span>
                  )}
                  <h3 className="font-sans font-bold text-slate-900 dark:text-white text-sm mb-0.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                    {cat.label}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-blue dark:text-slate-400 leading-none">
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
