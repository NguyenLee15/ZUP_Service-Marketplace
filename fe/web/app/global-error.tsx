'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <main className="flex min-h-screen items-center justify-center p-6">
          <section className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-300" aria-hidden="true">
              !
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">Không thể tải ứng dụng</h1>
              <p className="text-sm leading-6 text-slate-300">Đã xảy ra lỗi khi khởi tạo trang. Vui lòng thử tải lại.</p>
            </div>
            <button
              type="button"
              onClick={() => reset()}
              className="min-h-11 rounded-lg bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Tải lại trang
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
