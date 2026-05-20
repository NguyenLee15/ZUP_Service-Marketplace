import Link from 'next/link';

const QUICK_SEARCHES = ['Vệ sinh máy lạnh', 'Sửa điện nước', 'Dọn dẹp nhà'];
const SEARCH_PLACEHOLDER = 'Sửa máy lạnh chảy nước…';
const DEFAULT_LOCATION = 'Hà Nội';

type IconProps = {
  className?: string;
};

function SearchIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function MapPinIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function getQuickSearchHref(keyword: string) {
  const params = new URLSearchParams({
    keyword,
    location: DEFAULT_LOCATION,
  });

  return `/services?${params.toString()}`;
}

export function HeroSearchForm() {
  return (
    <form
      action="/services"
      method="get"
      className="mobile-viewport-width surface-card-elevated bg-white/95 backdrop-blur-2xl rounded-[1.25rem] sm:rounded-3xl p-3.5 sm:p-5 md:p-6 max-w-5xl transition-[background-color,box-shadow] duration-300 group/form"
    >
      <div className="grid md:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div className="md:col-span-2 flex items-center gap-3 sm:gap-4 bg-cloud-mist rounded-2xl px-4 sm:px-5 py-4 sm:py-5 border border-platinum-tint group focus-within:ring-4 focus-within:ring-action-blue/15 focus-within:border-action-blue transition-[box-shadow,border-color]">
          <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-action-blue group-focus-within:scale-105 transition-transform" />
          <input
            type="text"
            name="keyword"
            aria-label="Tìm kiếm dịch vụ"
            autoComplete="off"
            placeholder={SEARCH_PLACEHOLDER}
            className="min-w-0 flex-1 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-action-blue/40 rounded-lg text-midnight-indigo placeholder-slate-blue/70 text-base sm:text-lg font-semibold"
          />
        </div>

        <div className="flex items-center gap-3 sm:gap-4 bg-cloud-mist rounded-2xl px-4 sm:px-5 py-4 sm:py-5 border border-platinum-tint group focus-within:ring-4 focus-within:ring-action-blue/15 focus-within:border-action-blue transition-[box-shadow,border-color]">
          <MapPinIcon className="w-5 h-5 sm:w-6 sm:h-6 text-action-blue group-focus-within:scale-105 transition-transform" />
          <input
            type="text"
            name="location"
            aria-label="Vị trí tìm kiếm"
            autoComplete="street-address"
            placeholder="Vị trí…"
            defaultValue={DEFAULT_LOCATION}
            className="min-w-0 flex-1 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-action-blue/40 rounded-lg text-midnight-indigo placeholder-slate-blue/70 text-base sm:text-lg font-semibold"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-5 w-full">
        <div className="grid w-full grid-cols-1 items-center gap-2 min-[480px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-center md:justify-start">
          <span className="text-center text-xs font-bold text-slate-blue uppercase tracking-[0.16em] min-[480px]:col-span-2 sm:col-span-1 sm:text-left">Gợi ý:</span>
          {QUICK_SEARCHES.map((tag) => (
            <Link
              key={tag}
              href={getQuickSearchHref(tag)}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-full bg-pale-gray hover:bg-action-blue border border-transparent text-glacier-blue hover:text-white text-xs sm:text-sm font-bold transition-[background-color,color,box-shadow,transform] hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
            >
              {tag}
            </Link>
          ))}
        </div>

        <button
          type="submit"
          className="group relative justify-center px-6 py-3.5 rounded-xl bg-action-blue font-bold text-white shadow-[var(--brand-shadow-button)] hover:bg-glacier-blue hover:-translate-y-0.5 transition-[background-color,box-shadow,transform] overflow-hidden flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <SearchIcon className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Tìm dịch vụ</span>
        </button>
      </div>
    </form>
  );
}
