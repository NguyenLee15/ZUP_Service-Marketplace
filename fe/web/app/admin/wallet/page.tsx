'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, Loader2, WalletCards, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/admin/services/admin.api';
import { AdminPermissionGuard, useAdminPermission } from '@/features/admin/components/AdminPermissionGuard';
import { DepositProcessModal } from '@/features/admin/components/DepositProcessModal';
import { WithdrawalProcessModal, type ExtendedWithdrawalItem } from '@/features/admin/components/WithdrawalProcessModal';
import { AdminPermission } from '@/types/admin-permissions';
import type { AdminWalletDepositItem } from '@/features/admin/types/admin.types';

const statuses = ['all', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'] as const;
const statusIcon = { PENDING: <Clock className="h-3 w-3" />, APPROVED: <CheckCircle className="h-3 w-3" />, REJECTED: <XCircle className="h-3 w-3" />, EXPIRED: <Clock className="h-3 w-3" /> };

function AdminWalletContent() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermission();
  const canDeposit = hasPermission(AdminPermission.WALLET_DEPOSIT_MANAGE);
  const canWithdrawal = hasPermission(AdminPermission.WALLET_WITHDRAWAL_MANAGE);
  const [tab, setTab] = useState<'deposit' | 'withdrawal'>(canDeposit ? 'deposit' : 'withdrawal');
  const [status, setStatus] = useState<string>('PENDING');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<(AdminWalletDepositItem | ExtendedWithdrawalItem)[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminWalletDepositItem | ExtendedWithdrawalItem | null>(null);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const formatCurrency = (value: number | string) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))}₫`;
  const load = useCallback(async () => {
    const allowed = tab === 'deposit' ? canDeposit : canWithdrawal;
    if (!allowed) return;
    setLoading(true);
    try {
      const response = tab === 'deposit'
        ? await adminApi.getWalletDeposits({ page, limit: 15, ...(status !== 'all' ? { status } : {}) })
        : await adminApi.getWalletWithdrawals({ page, limit: 15, ...(status !== 'all' ? { status } : {}) });
      setItems(response.data.data as (AdminWalletDepositItem | ExtendedWithdrawalItem)[]);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotal(response.data.meta?.total || response.data.data.length);
    } catch {
      toast({ title: 'Không tải được dữ liệu ví', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [canDeposit, canWithdrawal, page, status, tab, toast]);

  useEffect(() => { void load(); }, [load]);
  const action = async (item: AdminWalletDepositItem | ExtendedWithdrawalItem, kind: 'approve' | 'reject') => {
    if (!note.trim() && kind === 'reject') { toast({ title: 'Vui lòng nhập lý do từ chối', variant: 'destructive' }); return; }
    setActionLoading(item.id);
    try {
      if (tab === 'deposit') {
        if (kind === 'approve') await adminApi.approveWalletDeposit(item.id, note.trim() || undefined);
        else await adminApi.rejectWalletDeposit(item.id, note.trim());
      } else if (kind === 'approve') {
        await adminApi.approveWalletWithdrawal(item.id, note.trim() || undefined);
      } else {
        await adminApi.rejectWalletWithdrawal(item.id, note.trim());
      }
      toast({ title: kind === 'approve' ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu' });
      setSelected(null); setNote(''); await load();
    } catch { toast({ title: 'Thao tác thất bại', variant: 'destructive' }); }
    finally { setActionLoading(null); }
  };

  return <div className="mx-auto w-full max-w-7xl space-y-5"><div className="flex items-center gap-3"><WalletCards className="h-6 w-6 text-blue-600" /><div><h1 className="text-2xl font-bold text-slate-900">Quản lý ví</h1><p className="text-sm text-slate-500">Xử lý yêu cầu nạp và rút tiền của nhà cung cấp.</p></div></div>
    <div className="flex gap-2 border-b pb-2">{canDeposit && <button type="button" onClick={() => { setTab('deposit'); setPage(1); }} className={`px-3 py-2 text-sm font-semibold ${tab === 'deposit' ? 'border-b-2 border-slate-900' : 'text-slate-500'}`}>Nạp tiền</button>}{canWithdrawal && <button type="button" onClick={() => { setTab('withdrawal'); setPage(1); }} className={`px-3 py-2 text-sm font-semibold ${tab === 'withdrawal' ? 'border-b-2 border-slate-900' : 'text-slate-500'}`}>Rút tiền</button>}</div>
    <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">{tab === 'deposit' ? 'Yêu cầu nạp tiền' : 'Yêu cầu rút tiền'}</CardTitle><span className="text-xs text-slate-500">Tổng cộng: <strong>{total}</strong></span></CardHeader><CardContent className="p-0"><div className="flex flex-wrap gap-1.5 border-b p-3">{statuses.filter((value) => tab === 'withdrawal' ? value !== 'EXPIRED' : true).map((value) => <button type="button" key={value} onClick={() => { setStatus(value); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${status === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{value === 'all' ? 'Tất cả' : value}</button>)}</div>{loading ? <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin" /></div> : items.length === 0 ? <div className="flex flex-col items-center gap-2 p-12 text-sm text-slate-500"><AlertCircle className="h-8 w-8" />Không có yêu cầu.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Mã</th><th className="px-5 py-3">Nhà cung cấp</th><th className="px-5 py-3">Số tiền</th><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.id}><td className="px-5 py-4 font-mono">#{item.id}</td><td className="px-5 py-4">{item.provider?.fullName || `#${item.providerId}`}</td><td className="px-5 py-4 font-semibold">{formatCurrency(item.amount)}</td><td className="px-5 py-4 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</td><td className="px-5 py-4"><Badge variant="outline" className="gap-1">{statusIcon[item.status as keyof typeof statusIcon]}{item.status}</Badge></td><td className="px-5 py-4 text-right">{item.status === 'PENDING' && <Button size="sm" onClick={() => { setSelected(item); setNote(''); }}>Xử lý</Button>}</td></tr>)}</tbody></table></div>}{totalPages > 1 && <div className="flex items-center justify-end gap-2 border-t p-3"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-xs">{page}/{totalPages}</span><Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight className="h-4 w-4" /></Button></div>}</CardContent></Card>
    {tab === 'deposit' ? <DepositProcessModal selected={selected as AdminWalletDepositItem | null} note={note} actionLoading={actionLoading} onClose={() => setSelected(null)} onNoteChange={setNote} onAction={action} formatCurrency={formatCurrency} /> : <WithdrawalProcessModal selected={selected as ExtendedWithdrawalItem | null} note={note} actionLoading={actionLoading} onClose={() => setSelected(null)} onNoteChange={setNote} onAction={action} formatCurrency={formatCurrency} />}
  </div>;
}

export default function AdminWalletPage() {
  return <AdminPermissionGuard permission={[AdminPermission.WALLET_DEPOSIT_MANAGE, AdminPermission.WALLET_WITHDRAWAL_MANAGE]}><AdminWalletContent /></AdminPermissionGuard>;
}
