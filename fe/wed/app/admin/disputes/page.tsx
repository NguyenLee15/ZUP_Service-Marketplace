'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import { bookingsApi } from '@/features/auth/services/api';
import { AlertTriangle, CheckCircle, Clock, Search, Eye } from 'lucide-react';

export default function AdminDisputesPage() {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [resolution, setResolution] = useState('');
  const [refundPercent, setRefundPercent] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Fetch disputed bookings
    bookingsApi.getMyBookings({ status: 'DISPUTED' })
      .then((res) => setDisputes(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async () => {
    if (!selected || !resolution) return;
    setActionLoading(true);
    try {
      await adminApi.resolveDispute(selected.id, {
        resolutionAction: refundPercent > 0 ? `REFUND_${refundPercent}%` : 'COMPLETE',
        resolutionReason: resolution
      });
      toast({ title: 'Đã giải quyết tranh chấp' });
      setSelected(null);
      setResolution('');
      setRefundPercent(0);
      // Refresh
      const res = await bookingsApi.getMyBookings({ status: 'DISPUTED' });
      setDisputes(res.data.data || []);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally { setActionLoading(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Quản Lý Tranh Chấp</h3>
        <p className="text-muted-foreground mt-1">Giải quyết khiếu nại từ khách hàng</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-medium">Không có tranh chấp nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d: any) => (
            <Card key={d.id} className="hover:shadow-md transition-shadow border-red-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-muted-foreground">#{d.bookingCode}</span>
                    <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Khiếu nại</Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{d.service?.name}</p>
                  <p className="text-xs text-muted-foreground">KH: {d.customer?.fullName} · {formatDate(d.createdAt)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelected(d)}>
                  <Eye className="w-4 h-4 mr-1" /> Xem
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Giải quyết tranh chấp #{selected.bookingCode}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Dịch vụ:</span> {selected.service?.name}</p>
                <p><span className="text-muted-foreground">Khách hàng:</span> {selected.customer?.fullName}</p>
                {selected.dispute && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 font-medium text-sm mb-1">Lý do khiếu nại:</p>
                    <p className="text-red-700 text-sm">{selected.dispute.reason}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quyết định</label>
                <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)}
                  placeholder="Mô tả quyết định giải quyết..." rows={3} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tỷ lệ hoàn tiền (%)</label>
                <div className="flex gap-2">
                  {[0, 25, 50, 75, 100].map((p) => (
                    <Button key={p} size="sm" variant={refundPercent === p ? 'default' : 'outline'}
                      onClick={() => setRefundPercent(p)} className="text-xs">
                      {p}%
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => { setSelected(null); setResolution(''); }}>Đóng</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" disabled={!resolution || actionLoading}
                  onClick={handleResolve}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Xác nhận giải quyết
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
