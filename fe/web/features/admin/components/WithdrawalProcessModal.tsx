"use client";

import React from "react";
import { Building2, CreditCard, Loader2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminWalletWithdrawalItem } from "@/features/admin/types/admin.types";

export interface ExtendedWithdrawalItem extends AdminWalletWithdrawalItem {
  bankName?: string;
  bankAccountHolder?: string;
}

export interface WithdrawalProcessModalProps {
  selected: ExtendedWithdrawalItem | null;
  note: string;
  actionLoading: number | null;
  onClose: () => void;
  onNoteChange: (note: string) => void;
  onAction: (item: ExtendedWithdrawalItem, action: "approve" | "reject") => void;
  formatCurrency: (amount: number) => string;
}

export function WithdrawalProcessModal({
  selected,
  note,
  actionLoading,
  onClose,
  onNoteChange,
  onAction,
  formatCurrency,
}: WithdrawalProcessModalProps) {
  return (
    <Dialog
      open={selected !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Xử lý yêu cầu rút tiền #{selected?.id}</DialogTitle>
        </DialogHeader>
        {selected && (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-slate-50 p-3 space-y-2 border border-slate-100 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="h-4 w-4" /> Thợ:
                </span>
                <span className="font-semibold text-slate-900">
                  {selected.provider?.fullName || `Thợ #${selected.providerId}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" /> Số tiền rút:
                </span>
                <span className="font-bold text-emerald-600 text-base">
                  {formatCurrency(selected.amount)}
                </span>
              </div>
              {selected.bankName && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> Thông tin thụ hưởng:
                  </div>
                  <div className="font-medium text-slate-800">
                    {selected.bankName} - {selected.bankAccountNumber}
                  </div>
                  <div className="text-xs text-slate-500 uppercase">
                    Chủ TK: {selected.bankAccountHolder}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Ghi chú nội bộ / Lý do từ chối
              </label>
              <Textarea
                placeholder="Nhập mã giao dịch chuyển khoản hoặc lý do nếu từ chối..."
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                className="text-sm min-h-[80px]"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                disabled={actionLoading !== null}
                onClick={() => onAction(selected, "reject")}
              >
                {actionLoading === selected.id && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Từ chối yêu cầu
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                disabled={actionLoading !== null}
                onClick={() => onAction(selected, "approve")}
              >
                {actionLoading === selected.id && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Xác nhận đã chuyển tiền
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

