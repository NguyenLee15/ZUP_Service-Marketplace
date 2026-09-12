'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { SmartBookingInput } from '@/app/components/bookings/SmartBookingInput';
import { DynamicQuestionnaire } from '@/app/components/bookings/DynamicQuestionnaire';
import type { SelectedItem } from '@/features/booking/hooks/useCreateBookingFlow';

interface BookingItemsSelectorProps {
  showSmartInput: boolean;
  setShowSmartInput: (val: boolean) => void;
  serviceId: string | null;
  service: ApiPayload;
  description: string;
  setDescription: (val: string) => void;
  fieldErrors: Record<string, string>;
  validate: (name: string, val: string) => void;
  setAiIntentResult: (val: ApiPayload) => void;
  onServiceSelect: (svcId: number) => void;
  selectedItems: Record<number, SelectedItem>;
  setSelectedItems: React.Dispatch<React.SetStateAction<Record<number, SelectedItem>>>;
  formatPrice: (price: number) => string;
}

export function BookingItemsSelector({
  showSmartInput,
  setShowSmartInput,
  serviceId,
  service,
  description,
  setDescription,
  fieldErrors,
  validate,
  setAiIntentResult,
  onServiceSelect,
  selectedItems,
  setSelectedItems,
  formatPrice,
}: BookingItemsSelectorProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* AI Smart Booking Input */}
      {showSmartInput && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2 p-4 sm:p-6">
          <SmartBookingInput
            onIntentExtracted={(result) => {
              setAiIntentResult(result);
              if (result.intent.summary) {
                setDescription(result.intent.summary);
                validate('description', result.intent.summary);
              }
            }}
            onServiceSelected={(svcId) => {
              onServiceSelect(svcId);
            }}
          />
        </div>
      )}

      {/* Toggle between Smart / Manual mode */}
      {serviceId && (
        <button
          type="button"
          onClick={() => setShowSmartInput(!showSmartInput)}
          className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-bold uppercase tracking-widest text-action-blue hover:text-glacier-blue transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {showSmartInput ? 'Quay lại nhập thủ công' : 'Dùng AI mô tả sự cố'}
        </button>
      )}

      {/* Traditional DynamicQuestionnaire (visible when serviceId exists and smart input is hidden) */}
      {(!showSmartInput || serviceId) && !showSmartInput && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2 p-4 sm:p-6">
          <DynamicQuestionnaire
            serviceName={service?.name || ''}
            description={description}
            onChange={(val) => {
              setDescription(val);
              validate('description', val);
            }}
            error={fieldErrors.description}
          />
        </div>
      )}

      {/* Service items selection */}
      {service?.items && service.items.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 p-4 sm:p-6">
          <div>
            <Label className="font-semibold text-sm flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Chọn hạng mục dịch vụ cần làm (nếu có)
            </Label>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Tích chọn những hạng mục bạn cần thợ thực hiện. Có thể tùy chỉnh số lượng.
            </p>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {service.items.map((item: ApiPayload) => {
              const isSelected = !!selectedItems[item.id];
              const qty = selectedItems[item.id]?.quantity || 1;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems((prev) => ({
                            ...prev,
                            [item.id]: {
                              serviceItemId: item.id,
                              quantity: 1,
                              name: item.name,
                              price: Number(item.price),
                              unit: item.unit,
                            },
                          }));
                        } else {
                          setSelectedItems((prev) => {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                          });
                        }
                      }}
                      className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <div
                      className="min-w-0 cursor-pointer flex-1"
                      onClick={() => {
                        setSelectedItems((prev) => {
                          if (isSelected) {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                          } else {
                            return {
                              ...prev,
                              [item.id]: {
                                serviceItemId: item.id,
                                quantity: 1,
                                name: item.name,
                                price: Number(item.price),
                                unit: item.unit,
                              },
                            };
                          }
                        });
                      }}
                    >
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatPrice(Number(item.price))} / {item.unit}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        type="button"
                        aria-label={`Giảm số lượng ${item.name}`}
                        onClick={() => {
                          setSelectedItems((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              quantity: Math.max(1, qty - 1),
                            },
                          }));
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-800 dark:text-slate-100 transition-colors active:scale-95 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-6 text-center text-slate-900 dark:text-slate-100">{qty}</span>
                      <button
                        type="button"
                        aria-label={`Tăng số lượng ${item.name}`}
                        onClick={() => {
                          setSelectedItems((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              quantity: qty + 1,
                            },
                          }));
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-800 dark:text-slate-100 transition-colors active:scale-95 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {Object.keys(selectedItems).length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Tạm tính hạng mục phát sinh:</span>
              <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                {formatPrice(
                  Object.values(selectedItems).reduce((sum, it) => sum + it.price * it.quantity, 0)
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

