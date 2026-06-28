'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle,
  Clock,
  Filter,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';

type WalletRequest = {
  id: number;
  amount: number | string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  adminNote?: string | null;
  transferCode?: string | null;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  createdAt: string;
  processedAt?: string | null;
  provider?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  processor?: {
    fullName: string;
    email: string;
  } | null;
};

const statusConfig = {
  PENDING: {
    label: 'Chờ xử lý',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200',
    icon: Clock,
  },
  APPROVED: {
    label: 'Đã xử lý',
    className: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Từ chối',
    className: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
    icon: XCircle,
  },
  EXPIRED: {
    label: 'Hết hạn',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200',
    icon: XCircle,
  },
};

// Deposits are automated via PayOS, no admin approval needed

const statusFilters = [
  { value: 'all', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'APPROVED', label: 'Đã xử lý' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'EXPIRED', label: 'Hết hạn' },
];

export default function AdminWalletPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState('PENDING');
  const [withdrawals, setWithdrawals] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selected, setSelected] = useState<WalletRequest | null>(null);
  const [note, setNote] = useState('');

  const requests = withdrawals;
  const activeLabel = 'yêu cầu rút';
  const activeTab = 'withdrawals';

  const summary = useMemo(() => {
    const list = requests;
    return {
      pending: list.filter(item => item.status === 'PENDING').length,
      approved: list.filter(item => item.status === 'APPROVED').length,
      rejected: list.filter(item => item.status === 'REJECTED').length,
    };
  }, [requests]);

  const formatCurrency = (value: number | string) =>
    `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))}₫`;

  const fetchRequests = async () => {
    setLoading(true);
    const params: Record<string, ApiPayload> = { page: 1, limit: 50 };
    if (status !== 'all') params.status = status;

    try {
      const res = await adminApi.getWalletWithdrawals(params);
      setWithdrawals(res.data?.data || []);
    } catch (err: ApiPayload) {
      toast({
        title: 'Không tải được dữ liệu ví',
        description: err.response?.data?.error?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [status]);

  const handleAction = async (request: WalletRequest, action: 'approve' | 'reject') => {
    setActionLoading(request.id);
    try {
      if (action === 'approve') await adminApi.approveWalletWithdrawal(request.id, note);
      else await adminApi.rejectWalletWithdrawal(request.id, note);

      toast({
        title: action === 'approve' ? 'Đã xác nhận' : 'Đã từ chối',
        description:
          action === 'approve'
            ? `Đã xử lý ${activeLabel} #${request.id}`
            : `Đã từ chối ${activeLabel} #${request.id}`,
      });
      setSelected(null);
      setNote('');
      fetchRequests();
    } catch (err: ApiPayload) {
      toast({
        title: 'Thao tác thất bại',
        description: err.response?.data?.error?.message || err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const renderStatus = (requestStatus: WalletRequest['status']) => {
    const config = statusConfig[requestStatus] || statusConfig.PENDING;
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} border-0`}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Quản Lý Ví</h3>
        <p className="mt-1 text-muted-foreground">
          Quản lý và xử lý yêu cầu rút tiền của nhà cung cấp.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Chờ xử lý</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Đã xử lý</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{summary.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Từ chối</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{summary.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs removed */}

      <div className="flex flex-wrap gap-2">
        {statusFilters.map(item => (
          <Button
            key={item.value}
            variant={status === item.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus(item.value)}
            className="gap-1"
          >
            <Filter className="h-3 w-3" />
            {item.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu rút tiền</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">Không có {activeLabel} nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Mã</th>
                    <th className="px-4 py-3 text-left font-medium">Nhà cung cấp</th>
                    <th className="px-4 py-3 text-left font-medium">Số tiền</th>
                    <th className="px-4 py-3 text-left font-medium">Thông tin</th>
                    <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(request => (
                    <tr key={request.id} className="border-b border-border hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">#{request.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{request.provider?.fullName || 'Nhà cung cấp'}</p>
                        <p className="text-xs text-muted-foreground">{request.provider?.email}</p>
                        {request.provider?.phone && (
                          <p className="text-xs text-muted-foreground">{request.provider.phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(request.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p>{request.bankName}</p>
                          <p className="font-medium">{request.bankAccountNumber}</p>
                          <p className="text-xs text-muted-foreground">{request.bankAccountHolder}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          {renderStatus(request.status)}
                          {request.adminNote && (
                            <p className="max-w-xs text-xs text-muted-foreground">{request.adminNote}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {request.status === 'PENDING' ? (
                          <Button size="sm" variant="outline" onClick={() => { setSelected(request); setNote(''); }}>
                            Xử lý
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {request.processedAt
                              ? new Date(request.processedAt).toLocaleString('vi-VN')
                              : 'Đã xử lý'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>
                Xử lý {activeLabel} #{selected.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Nhà cung cấp</p>
                    <p className="font-medium">{selected.provider?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Số tiền</p>
                    <p className="font-semibold">{formatCurrency(selected.amount)}</p>
                  </div>
                  {activeTab === 'withdrawals' ? (
                    <>
                      <div>
                        <p className="text-muted-foreground">Ngân hàng</p>
                        <p className="font-medium">{selected.bankName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tài khoản</p>
                        <p className="font-medium">{selected.bankAccountNumber}</p>
                        <p className="text-muted-foreground">{selected.bankAccountHolder}</p>
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2">
                      <p className="text-muted-foreground">Mã giao dịch / nội dung</p>
                      <p className="font-medium">{selected.transferCode || 'Chưa nhập'}</p>
                    </div>
                  )}
                </div>
              </div>

              <Textarea
                value={note}
                onChange={event => setNote(event.target.value)}
                rows={3}
                placeholder="Ghi chú xử lý hoặc lý do từ chối..."
              />

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Đóng
                </Button>
                <Button
                  variant="destructive"
                  disabled={actionLoading === selected.id}
                  onClick={() => handleAction(selected, 'reject')}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Từ chối
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={actionLoading === selected.id}
                  onClick={() => handleAction(selected, 'approve')}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Đã chuyển khoản
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
