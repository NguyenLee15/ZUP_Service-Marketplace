'use client';

import React from 'react';
import { Loader2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { AdminWalletDepositItem } from '@/features/admin/types/admin.types';

export function DepositProcessModal({ selected, note, actionLoading, onClose, onNoteChange, onAction, formatCurrency }: {
  selected: AdminWalletDepositItem | null;
  note: string;
  actionLoading: number | null;
  onClose: () => void;
  onNoteChange: (value: string) => void;
  onAction: (item: AdminWalletDepositItem, action: 'approve' | 'reject') => void;
  formatCurrency: (value: number | string) => string;
}) {
  return <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-[480px]"><DialogHeader><DialogTitle>Xử lý yêu cầu nạp tiền #{selected?.id}</DialogTitle></DialogHeader>{selected && <div className="space-y-4"><div className="rounded-lg border bg-slate-50 p-3 text-sm"><p className="flex justify-between"><span className="flex items-center gap-1 text-slate-500"><User className="h-4 w-4" />Nhà cung cấp</span><strong>{selected.provider?.fullName || `#${selected.providerId}`}</strong></p><p className="mt-2 flex justify-between"><span className="text-slate-500">Số tiền</span><strong className="text-emerald-600">{formatCurrency(selected.amount)}</strong></p><p className="mt-2 text-xs text-slate-500">Mã chuyển khoản: {selected.code || selected.transferContent || '—'}</p></div><Textarea value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Nhập ghi chú hoặc lý do từ chối..." /><DialogFooter><Button variant="outline" className="text-red-600" disabled={actionLoading !== null} onClick={() => onAction(selected, 'reject')}>{actionLoading === selected.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Từ chối</Button><Button className="bg-emerald-600 text-white" disabled={actionLoading !== null} onClick={() => onAction(selected, 'approve')}>{actionLoading === selected.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Duyệt nạp tiền</Button></DialogFooter></div>}</DialogContent></Dialog>;
}
