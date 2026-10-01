export default function NotificationsLoading() {
  return <div className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6" aria-busy="true" aria-label="Đang tải thông báo"><div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl border border-border bg-card" />)}</div>;
}
