'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Sparkles, XCircle, Zap } from 'lucide-react';
import { bookingApi } from '@/features/booking/services/booking.api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface BookingQuotationTableProps {
  booking: ApiPayload;
  originalQuote?: ApiPayload;
  supplementaryQuotes: ApiPayload[];
  isCustomer: boolean;
  actionLoading: boolean;
  handleAction: (action: () => Promise<ApiPayload>, msg: string) => Promise<void>;
  formatPrice: (p: number) => string;
}

export function BookingQuotationTable({
  booking,
  originalQuote,
  supplementaryQuotes,
  isCustomer,
  actionLoading,
  handleAction,
  formatPrice,
}: BookingQuotationTableProps) {
  const [rejectQuoteId, setRejectQuoteId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  return (
    <>
      {/* Chi tiết hạng mục yêu cầu đặt lịch ban đầu */}
      {booking.bookingItems && booking.bookingItems.length > 0 && (
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Chi tiết các hạng mục yêu cầu đặt lịch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table className="w-full text-left text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/40 border-b border-border">
                    <TableHead className="p-2.5 font-semibold text-muted-foreground">Tên hạng mục dịch vụ</TableHead>
                    <TableHead className="p-2.5 font-semibold text-center w-24 text-muted-foreground">Số lượng</TableHead>
                    <TableHead className="p-2.5 font-semibold text-right w-24 text-muted-foreground">Tạm tính</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.bookingItems.map((item: ApiPayload) => (
                    <TableRow key={item.id} className="border-b border-border hover:bg-muted/30">
                      <TableCell className="p-2.5 text-foreground font-medium">{item.name}</TableCell>
                      <TableCell className="p-2.5 text-center text-foreground/80 font-mono tabular-nums">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="p-2.5 text-right text-foreground font-bold font-mono tabular-nums">
                        {formatPrice(Number(item.priceSnapshot) * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Báo giá và các hạng mục chi tiết sau khảo sát */}
      {originalQuote && (
        <Card className="rounded-xl border border-border bg-card shadow-sm relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary flex items-center gap-2 font-bold">
              <Zap className="w-4 h-4 text-primary" />
              Bảng báo giá thực tế sau khảo sát
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            {originalQuote.quotationItems && originalQuote.quotationItems.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table className="w-full text-left text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-b border-border">
                      <TableHead className="p-2.5 font-semibold text-foreground">Chi tiết hạng mục sửa chữa thực tế</TableHead>
                      <TableHead className="p-2.5 font-semibold text-center w-24 text-foreground">Số lượng</TableHead>
                      <TableHead className="p-2.5 font-semibold text-right w-24 text-foreground">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {originalQuote.quotationItems.map((item: ApiPayload) => {
                      const originallyOrdered = booking.bookingItems?.some(
                        (bItem: ApiPayload) =>
                          bItem.name.toLowerCase().trim() === item.name.toLowerCase().trim(),
                      );
                      return (
                        <TableRow
                          key={item.id}
                          className={`border-b border-border hover:bg-muted/30 transition-colors ${
                            !originallyOrdered
                              ? 'bg-amber-500/5 text-amber-700 dark:text-amber-300 border-l-2 border-l-amber-500'
                              : ''
                          }`}
                        >
                          <TableCell className="p-2.5 font-medium">
                            {item.name}
                            {!originallyOrdered && (
                              <span className="ml-1.5 inline-block text-[9px] px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded font-semibold uppercase tracking-wider">
                                Thay đổi
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="p-2.5 text-center font-mono tabular-nums">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="p-2.5 text-right font-bold text-primary font-mono tabular-nums">
                            {formatPrice(Number(item.price) * item.quantity)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            <div className="space-y-2 mt-4 pt-2 border-t border-border">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground text-xs">Tổng chi phí thực tế:</span>
                <span className="font-extrabold text-xl text-primary font-mono tabular-nums">
                  {formatPrice(Number(originalQuote.actualPrice))}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground text-xs">Thời gian thực hiện dự kiến:</span>
                <span className="font-semibold text-xs text-foreground/90">
                  {originalQuote.estimatedTime}
                </span>
              </div>
            </div>

            {originalQuote.note && (
              <div className="text-muted-foreground mt-2 text-xs bg-muted/40 p-3 rounded-xl border border-border">
                <span className="font-semibold text-foreground block mb-1">
                  Ghi chú từ thợ:
                </span>
                {originalQuote.note}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Báo giá bổ sung */}
      {supplementaryQuotes.map((suppQuote: ApiPayload, index: number) => (
        <Card
          key={suppQuote.id}
          className="rounded-xl border border-amber-500/30 bg-card border-l-4 border-l-amber-500 relative overflow-hidden mt-4 shadow-sm"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-600 flex items-center justify-between gap-2 font-bold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Báo giá phát sinh #{index + 1}
              </div>
              {suppQuote.status === 'PENDING' && (
                <Badge variant="outline" className="text-amber-600 border-amber-500 bg-amber-50 dark:bg-amber-950/40">
                  Đang chờ duyệt
                </Badge>
              )}
              {suppQuote.status === 'ACCEPTED' && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40">
                  Đã đồng ý
                </Badge>
              )}
              {suppQuote.status === 'REJECTED' && (
                <Badge variant="outline" className="text-rose-600 border-rose-500 bg-rose-50 dark:bg-rose-950/40">
                  Đã từ chối
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            {suppQuote.quotationItems && suppQuote.quotationItems.length > 0 ? (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 overflow-hidden">
                <Table className="w-full text-left text-xs">
                  <TableHeader>
                    <TableRow className="bg-amber-500/10 border-b border-amber-500/20">
                      <TableHead className="p-2.5 font-semibold text-amber-900 dark:text-amber-100">Hạng mục phát sinh</TableHead>
                      <TableHead className="p-2.5 font-semibold text-center w-24 text-amber-900 dark:text-amber-100">Số lượng</TableHead>
                      <TableHead className="p-2.5 font-semibold text-right w-24 text-amber-900 dark:text-amber-100">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppQuote.quotationItems.map((item: ApiPayload) => (
                      <TableRow key={item.id} className="border-b border-amber-500/10">
                        <TableCell className="p-2.5 font-medium">{item.name}</TableCell>
                        <TableCell className="p-2.5 text-center font-mono tabular-nums">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="p-2.5 text-right font-bold text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                          {formatPrice(Number(item.price) * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            <div className="flex justify-between items-center py-1 mt-2 border-t border-amber-500/20 pt-2">
              <span className="text-muted-foreground text-xs">Tổng phát sinh:</span>
              <span className="font-extrabold text-lg text-amber-600 font-mono tabular-nums">
                {formatPrice(Number(suppQuote.actualPrice))}
              </span>
            </div>

            {suppQuote.note && (
              <div className="text-muted-foreground mt-2 text-xs bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                <span className="font-semibold text-amber-800 dark:text-amber-200 block mb-1">
                  Lý do phát sinh:
                </span>
                {suppQuote.note}
              </div>
            )}

            {suppQuote.status === 'PENDING' && isCustomer && (
              <div className="flex gap-2 mt-4 pt-2">
                <Button
                  onClick={() =>
                    handleAction(
                      () => bookingApi.confirmSupplementaryQuote(booking.id, suppQuote.id),
                      'Đã đồng ý báo giá phát sinh',
                    )
                  }
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đồng ý
                </Button>
                <Button
                  onClick={() => {
                    setRejectQuoteId(suppQuote.id);
                    setRejectReason('');
                  }}
                  variant="outline"
                  disabled={actionLoading}
                  className="flex-1 border-red-200 text-red-600 h-9 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Từ chối
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Dialog từ chối báo giá phát sinh chuyên nghiệp, thay thế window.prompt */}
      <Dialog
        open={rejectQuoteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectQuoteId(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối báo giá phát sinh</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để thông báo tới thợ kỹ thuật.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <textarea
              className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập lý do từ chối (ví dụ: Chi phí phát sinh quá cao, không đồng ý phụ tùng thay thế...)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectQuoteId(null);
                setRejectReason('');
              }}
              disabled={actionLoading}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actionLoading || !rejectReason.trim()}
              onClick={async () => {
                if (!rejectQuoteId || !rejectReason.trim()) return;
                const quoteIdToReject = rejectQuoteId;
                const reasonToSend = rejectReason.trim();
                setRejectQuoteId(null);
                setRejectReason('');
                await handleAction(
                  () =>
                    bookingApi.rejectSupplementaryQuote(
                      booking.id,
                      quoteIdToReject,
                      reasonToSend,
                    ),
                  'Đã từ chối báo giá phát sinh',
                );
              }}
            >
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

