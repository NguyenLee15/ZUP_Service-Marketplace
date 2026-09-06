'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Sparkles, XCircle, Zap } from 'lucide-react';
import { bookingsApi } from '@/features/auth/services/api';

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
  return (
    <>
      {/* Chi tiết hạng mục yêu cầu đặt lịch ban đầu */}
      {booking.bookingItems && booking.bookingItems.length > 0 && (
        <Card className="glass-panel glow-hover rounded-2xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-action-blue flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Chi tiết các hạng mục yêu cầu đặt lịch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/5 text-muted-foreground border-b border-white/10">
                    <th className="p-2.5 font-semibold">Tên hạng mục dịch vụ</th>
                    <th className="p-2.5 font-semibold text-center w-24">Số lượng</th>
                    <th className="p-2.5 font-semibold text-right w-24">Tạm tính</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.bookingItems.map((item: ApiPayload) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-2.5 text-foreground font-medium">{item.name}</td>
                      <td className="p-2.5 text-center text-foreground/80">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-2.5 text-right text-foreground font-bold">
                        {formatPrice(Number(item.priceSnapshot) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Báo giá và các hạng mục chi tiết sau khảo sát */}
      {originalQuote && (
        <Card className="glass-panel rounded-2xl border-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-action-blue/10 via-transparent to-transparent pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-action-blue flex items-center gap-2 font-bold">
              <Zap className="w-4 h-4 text-cyan-300 fill-cyan-300/20" />
              Bảng báo giá thực tế sau khảo sát
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            {originalQuote.quotationItems && originalQuote.quotationItems.length > 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/10 text-slate-900 dark:text-white/80 border-b border-white/15">
                      <th className="p-2.5 font-semibold">Chi tiết hạng mục sửa chữa thực tế</th>
                      <th className="p-2.5 font-semibold text-center w-24">Số lượng</th>
                      <th className="p-2.5 font-semibold text-right w-24">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {originalQuote.quotationItems.map((item: ApiPayload) => {
                      const originallyOrdered = booking.bookingItems?.some(
                        (bItem: ApiPayload) =>
                          bItem.name.toLowerCase().trim() === item.name.toLowerCase().trim(),
                      );
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                            !originallyOrdered
                              ? 'bg-amber-500/10 text-amber-500 border-l-2 border-l-amber-500'
                              : ''
                          }`}
                        >
                          <td className="p-2.5 font-medium">
                            {item.name}
                            {!originallyOrdered && (
                              <span className="ml-1.5 inline-block text-[9px] px-1 py-0.2 bg-amber-500/20 rounded font-bold uppercase tracking-wider">
                                Thay đổi
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="p-2.5 text-right font-bold text-action-blue">
                            {formatPrice(Number(item.price) * item.quantity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="space-y-2 mt-4 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground text-xs">Tổng chi phí thực tế:</span>
                <span className="font-extrabold text-xl text-action-blue">
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
              <div className="text-muted-foreground mt-2 text-xs bg-pale-gray/40 dark:bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="font-semibold text-foreground block mb-1">
                  💬 Ghi chú từ thợ:
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
          className="glass-panel rounded-2xl border-amber-500/50 border-l-4 relative overflow-hidden mt-4"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-600 flex items-center justify-between gap-2 font-bold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Báo giá phát sinh #{index + 1}
              </div>
              {suppQuote.status === 'PENDING' && (
                <Badge variant="outline" className="text-amber-500 border-amber-500 bg-amber-50">
                  Đang chờ duyệt
                </Badge>
              )}
              {suppQuote.status === 'ACCEPTED' && (
                <Badge variant="outline" className="text-green-500 border-green-500 bg-green-50">
                  Đã đồng ý
                </Badge>
              )}
              {suppQuote.status === 'REJECTED' && (
                <Badge variant="outline" className="text-red-500 border-red-500 bg-red-50">
                  Đã từ chối
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            {suppQuote.quotationItems && suppQuote.quotationItems.length > 0 ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-500/10 text-amber-900 dark:text-amber-100 border-b border-amber-500/20">
                      <th className="p-2.5 font-semibold">Hạng mục phát sinh</th>
                      <th className="p-2.5 font-semibold text-center w-24">Số lượng</th>
                      <th className="p-2.5 font-semibold text-right w-24">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppQuote.quotationItems.map((item: ApiPayload) => (
                      <tr key={item.id} className="border-b border-amber-500/10">
                        <td className="p-2.5 font-medium">{item.name}</td>
                        <td className="p-2.5 text-center">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-2.5 text-right font-bold text-amber-700 dark:text-amber-300">
                          {formatPrice(Number(item.price) * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="flex justify-between items-center py-1 mt-2 border-t border-amber-500/20 pt-2">
              <span className="text-muted-foreground text-xs">Tổng phát sinh:</span>
              <span className="font-extrabold text-lg text-amber-600">
                {formatPrice(Number(suppQuote.actualPrice))}
              </span>
            </div>

            {suppQuote.note && (
              <div className="text-muted-foreground mt-2 text-xs bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                <span className="font-semibold text-amber-800 block mb-1">
                  💬 Lý do phát sinh:
                </span>
                {suppQuote.note}
              </div>
            )}

            {suppQuote.status === 'PENDING' && isCustomer && (
              <div className="flex gap-2 mt-4 pt-2">
                <Button
                  onClick={() =>
                    handleAction(
                      () => bookingsApi.confirmSupplementaryQuote(booking.id, suppQuote.id),
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
                    const reason = window.prompt('Lý do từ chối báo giá phát sinh này?');
                    if (reason) {
                      handleAction(
                        () =>
                          bookingsApi.rejectSupplementaryQuote(
                            booking.id,
                            suppQuote.id,
                            reason,
                          ),
                        'Đã từ chối báo giá phát sinh',
                      );
                    }
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
    </>
  );
}

