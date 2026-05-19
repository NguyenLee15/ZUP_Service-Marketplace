import Link from 'next/link';
import { 
  Wrench, Home as HomeIcon, Heart, Briefcase, Palette, 
  Smartphone, Utensils, BookOpen 
} from 'lucide-react';

const categories = [
  { icon: Wrench, label: 'Sửa chữa', count: 1200, categoryId: 3 },
  { icon: HomeIcon, label: 'Vệ sinh', count: 850, categoryId: 1 },
  { icon: Heart, label: 'Làm đẹp', count: 2300, categoryId: 4 },
  { icon: Briefcase, label: 'Tư vấn', count: 450, categoryId: 8 },
  { icon: Palette, label: 'Thiết kế', count: 680, categoryId: 9 },
  { icon: Smartphone, label: 'Công nghệ', count: 1100, categoryId: 10 },
  { icon: Utensils, label: 'Nấu ăn', count: 920, categoryId: 11 },
  { icon: BookOpen, label: 'Giáo dục', count: 1450, categoryId: 12 },
];

export function CategoryGrid() {
  return (
    <section className="relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-[50px] font-bold brand-heading mb-4 md:mb-5 leading-tight text-balance">
              Bạn cần trợ giúp gì <br />
              <span className="text-action-blue">ngay hôm nay?</span>
            </h2>
            <p className="text-slate-blue text-base md:text-lg font-medium leading-relaxed max-w-2xl">
              Chọn nhanh nhóm dịch vụ phổ biến để xem thợ phù hợp, giá tham khảo và đánh giá từ khách hàng.
            </p>
          </div>
          <Link href="/services" prefetch={false} className="text-glacier-blue font-bold text-sm md:text-base inline-flex items-center justify-center gap-2 group px-5 py-3 bg-pale-gray rounded-xl hover:bg-action-blue hover:text-white transition-[background-color,color,box-shadow] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
            Xem tất cả
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
 
        <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-x-2 sm:gap-x-5 gap-y-6 md:gap-y-8 md:gap-6">
          {categories.map((cat, idx) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={idx}
                href={`/services?categoryIds=${cat.categoryId}`}
                prefetch={false}
                aria-label={`Xem dịch vụ ${cat.label}`}
                className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4"
              >
                <div className="group flex flex-col items-center gap-2 sm:gap-4 cursor-pointer active-pop">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-[5.5rem] md:h-[5.5rem] bg-white rounded-2xl md:rounded-[1.25rem] flex items-center justify-center shadow-[var(--brand-shadow-sm)] border border-platinum-tint/70 group-hover:shadow-[var(--brand-shadow-card)] group-hover:-translate-y-1 transition-[box-shadow,transform,border-color] duration-300 relative overflow-hidden group-hover:border-action-blue/30">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <IconComponent className="w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 text-action-blue group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-midnight-indigo text-[10px] sm:text-sm md:text-base mb-0.5 sm:mb-1 group-hover:text-action-blue transition-colors line-clamp-1">{cat.label}</h3>
                    <p className="text-[9px] sm:text-[11px] font-semibold text-muted-foreground tabular-nums">
                      {cat.count}+ <span className="hidden sm:inline">thợ</span>
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
