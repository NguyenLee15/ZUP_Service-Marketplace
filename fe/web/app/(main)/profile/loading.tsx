export default function ProfileLoading() {
  return <div className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6" aria-busy="true" aria-label="Đang tải hồ sơ"><div className="h-8 w-48 animate-pulse rounded-lg bg-muted" /><div className="h-72 animate-pulse rounded-2xl border border-border bg-card" /></div>;
}
