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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 md:mb-6 gap-4">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold brand-heading mb-2 leading-tight text-balance">
              Bạn cần trợ giúp gì <br />
              <span className="text-action-blue">ngay hôm nay?</span>
            </h2>
            <p className="text-slate-blue text-sm md:text-base font-medium leading-relaxed max-w-2xl">
              Chọn nhanh nhóm dịch vụ phổ biến để xem thợ phù hợp, giá tham khảo và đánh giá từ khách hàng.
            </p>
          </div>
          <Link href="/services" prefetch={false} className="text-glacier-blue font-bold text-sm inline-flex items-center justify-center gap-2 group px-4 py-2 bg-pale-gray rounded-lg hover:bg-action-blue hover:text-white transition-[background-color,color,box-shadow] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
            Xem tất cả
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
 
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Large Card: Sửa chữa (CategoryId: 3) */}
          <Link
            href="/services?categoryIds=3"
            prefetch={false}
            className="col-span-2 glass-panel rounded-xl p-4 md:p-5 flex flex-col justify-between group glow-hover transition-all duration-300 relative overflow-hidden min-h-[150px] md:min-h-[170px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-teal-500/5 to-transparent z-0" />
            <div className="relative z-10 flex justify-between items-start">
              <div className="p-3 bg-sky-600/10 dark:bg-sky-400/10 rounded-2xl backdrop-blur-md border border-sky-500/20">
                <Wrench className="w-6 h-6 md:w-7 md:h-7 text-sky-600 dark:text-sky-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="font-bold text-sm text-sky-600 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 duration-300">
                →
              </span>
            </div>
            <div className="relative z-10 mt-auto">
              <span className="text-[10px] md:text-xs font-black tracking-widest text-sky-600 dark:text-sky-400 uppercase">Phổ biến nhất</span>
              <h3 className="font-sans text-xl md:text-2xl font-extrabold text-midnight-indigo dark:text-white mt-1 leading-tight">
                Sửa chữa &amp; Bảo trì
              </h3>
              <p className="font-sans text-xs md:text-sm text-slate-blue dark:text-slate-300 mt-1">
                Điện nước, điện lạnh, nội thất gia dụng
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 bg-sky-600/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400 rounded-md">
                  1,200+ Thợ sẵn sàng
                </span>
              </div>
            </div>
          </Link>

          {/* Standard Bento Cards for the remaining 7 categories */}
          {categories.filter(cat => cat.categoryId !== 3).map((cat, idx) => {
            const IconComponent = cat.icon;
            
            // Generate distinctive color configurations for each category tile
            const colorSchemes = [
              { bg: 'group-hover:bg-teal-500/10 border-teal-500/10 text-teal-500', label: 'Vệ sinh' },
              { bg: 'group-hover:bg-pink-500/10 border-pink-500/10 text-pink-500', label: 'Làm đẹp' },
              { bg: 'group-hover:bg-violet-500/10 border-violet-500/10 text-violet-500', label: 'Tư vấn' },
              { bg: 'group-hover:bg-emerald-500/10 border-emerald-500/10 text-emerald-500', label: 'Thiết kế' },
              { bg: 'group-hover:bg-cyan-500/10 border-cyan-500/10 text-cyan-500', label: 'Công nghệ' },
              { bg: 'group-hover:bg-orange-500/10 border-orange-500/10 text-orange-500', label: 'Nấu ăn' },
              { bg: 'group-hover:bg-amber-500/10 border-amber-500/10 text-amber-500', label: 'Giáo dục' }
            ];

            const scheme = colorSchemes[idx % colorSchemes.length];

            return (
              <Link
                key={idx}
                href={`/services?categoryIds=${cat.categoryId}`}
                prefetch={false}
                aria-label={`Xem dịch vụ ${cat.label}`}
                className="glass-panel rounded-xl p-3 md:p-4 flex flex-col justify-center items-center text-center gap-2 group glow-hover transition-all duration-300 min-h-[118px] md:min-h-[136px] cursor-pointer hover:-translate-y-0.5"
              >
                <div className={`p-2.5 bg-slate-100 dark:bg-white/5 rounded-xl transition-all duration-300 ${scheme.bg.split(' ')[0]}`}>
                  <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110 ${scheme.bg.split(' ')[2]}`} />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-0.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                    {cat.label}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-blue dark:text-slate-400">
                    {cat.count}+ thợ
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
