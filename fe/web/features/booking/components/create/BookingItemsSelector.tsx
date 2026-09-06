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
        <div className="glass-panel glow-hover space-y-2 p-4 sm:p-6 rounded-[20px] text-white shadow-xl">
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
        <div className="glass-panel glow-hover space-y-2 p-4 sm:p-6 rounded-[20px] text-white shadow-xl">
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
        <div className="glass-panel glow-hover space-y-3 rounded-[20px] p-4 sm:p-6 text-white shadow-xl">
          <div>
            <Label className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-action-blue" />
              Chọn hạng mục dịch vụ cần làm (nếu có)
            </Label>
            <p className="text-[10px] text-muted-foreground mt-1">
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
                      ? 'border-action-blue bg-action-blue/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
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
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-action-blue focus:ring-action-blue focus:ring-offset-0 cursor-pointer"
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
                      <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatPrice(Number(item.price))} / {item.unit}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItems((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              quantity: Math.max(1, qty - 1),
                            },
                          }));
                        }}
                        className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-white transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-6 text-center text-white">{qty}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItems((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              quantity: qty + 1,
                            },
                          }));
                        }}
                        className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-white transition-colors"
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
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Tạm tính hạng mục phát sinh:</span>
              <span className="text-sm font-bold text-cyan-300">
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

