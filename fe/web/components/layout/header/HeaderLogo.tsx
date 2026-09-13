'use client';

import Link from 'next/link';

export function HeaderLogo() {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link
        href="/"
        prefetch={false}
        className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl active:scale-95 transition-transform duration-200"
        aria-label="Về trang chủ ZUP"
      >
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white font-extrabold text-base sm:text-lg shadow-sm shadow-sky-600/20 group-hover:bg-sky-500 transition-colors">
          Z
        </div>
        <div className="flex flex-col">
          <span className="font-sans font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100 leading-none">
            ZUP
          </span>
          <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-none mt-0.5">
            Dịch vụ gia đình
          </span>
        </div>
      </Link>
    </div>
  );
}

