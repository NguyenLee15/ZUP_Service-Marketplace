'use client';

import React from 'react';
import { Clock, Sparkles, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatLocalDateTimeInput } from '@/lib/datetime-local';
import type { SelectedItem } from '@/features/booking/hooks/useCreateBookingFlow';

interface BookingSchedulePickerProps {
  timeMode: 'now' | 'scheduled';
  setTimeMode: (mode: 'now' | 'scheduled') => void;
  desiredTime: string;
  setDesiredTime: (time: string) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  validate: (name: string, val: string) => void;
  service: ApiPayload;
  addressDetail: string;
  ward: string;
  selectedItems: Record<number, SelectedItem>;
  formatPrice: (price: number) => string;
}

export function BookingSchedulePicker({
  timeMode,
  setTimeMode,
  desiredTime,
  setDesiredTime,
  fieldErrors,
  setFieldErrors,
  validate,
  service,
  addressDetail,
  ward,
  selectedItems,
  formatPrice,
}: BookingSchedulePickerProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs space-y-4">
        <Label className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          Thời gian mong muốn thực hiện *
        </Label>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => {
              setTimeMode('now');
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.desiredTime;
                return next;
              });
            }}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
              timeMode === 'now'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
            }`}
          >
            <TrendingUp
              className={`w-5 h-5 ${
                timeMode === 'now' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
              }`}
            />
            <span className="text-xs sm:text-sm font-bold">Đặt ngay</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
              Thợ đến càng sớm càng tốt
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTimeMode('scheduled')}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
              timeMode === 'scheduled'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Clock
              className={`w-5 h-5 ${
                timeMode === 'scheduled' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
              }`}
            />
            <span className="text-xs sm:text-sm font-bold">Hẹn giờ</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
              Chọn thời gian cụ thể
            </span>
          </button>
        </div>

        {timeMode === 'scheduled' && (
          <div className="animate-in fade-in duration-300 slide-in-from-top-2">
            <Input
              id="booking-desired-time"
              name="desiredTime"
              autoComplete="off"
              type="datetime-local"
              value={desiredTime}
              onChange={(e) => {
                setDesiredTime(e.target.value);
                validate('desiredTime', e.target.value);
              }}
              min={formatLocalDateTimeInput(new Date())}
              className={
                fieldErrors.desiredTime
                  ? 'border-red-500'
                  : 'border-white/10 bg-white/5 h-11 rounded-xl'
              }
            />
            {fieldErrors.desiredTime && (
              <p className="text-red-500 text-[10px] mt-1">{fieldErrors.desiredTime}</p>
            )}

            {/* AI Scheduling Hints */}
            <div className="mt-4 p-4 rounded-[20px] bg-white/5 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 rotate-12 transition-transform group-hover:scale-110">
                <Sparkles className="w-12 h-12 text-sky-400" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
                  Gợi ý lịch hẹn thông minh (AI)
                </span>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(9, 0, 0, 0);
                    const value = formatLocalDateTimeInput(tomorrow);
                    setDesiredTime(value);
                    validate('desiredTime', value);
                  }}
                  className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-green-500/10 text-green-400 rounded-lg shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Sáng mai, 09:00</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                        Khung giờ vàng - Thợ trống lịch gần đây
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white border-0 text-[9px] sm:text-[10px] font-bold uppercase self-start sm:self-auto">
                    -10% phí dịch vụ
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    now.setHours(now.getHours() + 2);
                    const value = formatLocalDateTimeInput(now);
                    setDesiredTime(value);
                    validate('desiredTime', value);
                  }}
                  className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Hôm nay, trong 2 giờ tới</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                        Hỗ trợ nhận đơn khẩn cấp
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-sky-500 text-white border-0 text-[9px] sm:text-[10px] font-bold uppercase self-start sm:self-auto">
                    Nhận ngay
                  </Badge>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Summary Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs space-y-3">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          Tóm tắt yêu cầu đặt lịch
        </h4>

        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex justify-between items-start gap-2">
            <span>Dịch vụ chính:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[200px] truncate">
              {service?.name}
            </span>
          </div>
          <div className="flex justify-between items-start gap-2">
            <span>Địa điểm thực hiện:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[220px] truncate">
              {addressDetail ? `${addressDetail}, ${ward}` : 'Chưa điền'}
            </span>
          </div>
          <div className="flex justify-between items-start gap-2">
            <span>Thời gian mong muốn:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
              {timeMode === 'now'
                ? 'Làm ngay'
                : desiredTime
                ? new Date(desiredTime).toLocaleString('vi-VN')
                : 'Chưa chọn'}
            </span>
          </div>

          {Object.keys(selectedItems).length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="block font-semibold text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider mb-0.5">
                Hạng mục phát sinh:
              </span>
              {Object.values(selectedItems).map((it) => (
                <div key={it.serviceItemId} className="flex justify-between items-center text-[11px]">
                  <span className="max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                    • {it.name} (x{it.quantity})
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatPrice(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
            Tổng chi phí tạm tính:
          </span>
          <span className="text-base sm:text-lg font-extrabold text-sky-600 dark:text-sky-400">
            {formatPrice(
              Number(service?.referencePrice || 0) +
                Object.values(selectedItems).reduce(
                  (sum, it) => sum + it.price * it.quantity,
                  0
                )
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

