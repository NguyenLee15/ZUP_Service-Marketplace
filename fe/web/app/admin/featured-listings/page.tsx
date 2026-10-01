'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Star } from 'lucide-react';
import { AdminPermissionGuard } from '@/features/admin/components/AdminPermissionGuard';
import { AdminPermission } from '@/types/admin-permissions';
import { adminApi } from '@/features/admin/services/admin.api';
import type { AdminFeaturedListingItem } from '@/features/admin/types/admin.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const filters = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'EXPIRED', label: 'Đã hết hạn' },
  { value: 'CANCELLED', label: 'Đã hủy' },
] as const;

function FeaturedListingsContent() {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>('ACTIVE');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminFeaturedListingItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getFeaturedListings({
        page,
        limit: 20,
        ...(status ? { status } : {}),
      });
      setItems(response.data.data as AdminFeaturedListingItem[]);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch {
      toast({ title: 'Không tải được tin nổi bật', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, status, toast]);

  useEffect(() => { void load(); }, [load]);

  const cancel = async (item: AdminFeaturedListingItem) => {
    if (item.status !== 'ACTIVE' || !window.confirm('Hủy tin nổi bật này?')) return;
    setCancelling(item.id);
    try {
      await adminApi.cancelFeaturedListing(item.id);
      toast({ title: 'Đã hủy tin nổi bật' });
      await load();
    } catch {
      toast({ title: 'Không thể hủy tin nổi bật', variant: 'destructive' });
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="flex items-center gap-3 border-b border-[var(--admin-border)] pb-4">
        <Star className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Tin nổi bật</h1>
          <p className="text-sm text-slate-500">Theo dõi và hủy các dịch vụ đang được đẩy lên đầu danh sách.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Danh sách tin nổi bật</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((filter) => (
              <button key={filter.value} type="button" onClick={() => { setStatus(filter.value); setPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${status === filter.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {filter.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin" /></div> : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-sm text-slate-500"><AlertCircle className="h-8 w-8" />Chưa có tin nổi bật.</div>
          ) : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Dịch vụ</th><th className="px-5 py-3">Nhà cung cấp</th><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.id}><td className="px-5 py-4 font-medium">{item.service?.name || `Dịch vụ #${item.serviceId}`}</td><td className="px-5 py-4">{item.provider?.fullName || `Nhà cung cấp #${item.providerId}`}</td><td className="px-5 py-4 text-xs text-slate-500">{new Date(item.startDate).toLocaleDateString('vi-VN')} – {new Date(item.endDate).toLocaleDateString('vi-VN')}</td><td className="px-5 py-4"><Badge variant="outline">{item.status}</Badge></td><td className="px-5 py-4 text-right">{item.status === 'ACTIVE' && <Button size="sm" variant="outline" disabled={cancelling === item.id} onClick={() => void cancel(item)}>{cancelling === item.id && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}Hủy</Button>}</td></tr>)}</tbody></table></div>}
          {totalPages > 1 && <div className="flex items-center justify-end gap-2 border-t p-3"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-xs">{page}/{totalPages}</span><Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight className="h-4 w-4" /></Button></div>}
        </CardContent>
      </Card>
    </div>
  );
}

export default function FeaturedListingsPage() {
  return <AdminPermissionGuard permission={AdminPermission.SERVICE_MODERATE}><FeaturedListingsContent /></AdminPermissionGuard>;
}
