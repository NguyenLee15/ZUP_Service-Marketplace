'use client';

import React from 'react';
import { Check, Clock, MapPin, Wrench } from 'lucide-react';

interface BookingStepIndicatorProps {
  step: number;
  setStep: (step: number) => void;
  isStep1Valid: boolean;
  isStep2Valid: boolean;
}

const STEPS = [
  { s: 1, label: 'Chi tiết yêu cầu', icon: Wrench },
  { s: 2, label: 'Địa chỉ thực hiện', icon: MapPin },
  { s: 3, label: 'Lên lịch & Hoàn tất', icon: Clock },
];

const STEP_TITLES = [
  'Chi tiết hạng mục yêu cầu',
  'Địa điểm cung cấp dịch vụ',
  'Thời gian thực hiện mong muốn',
];

export function BookingStepIndicator({
  step,
  setStep,
  isStep1Valid,
  isStep2Valid,
}: BookingStepIndicatorProps) {
  return (
    <div>
      {/* Dynamic Progress Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative px-4">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-white/10 -z-10">
            <div
              className="h-full bg-gradient-to-r from-action-blue to-glacier-blue transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>

          {STEPS.map((item) => {
            const isCompleted = step > item.s;
            const isActive = step === item.s;
            const StepIcon = item.icon;

            return (
              <div key={item.s} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (item.s < step) setStep(item.s);
                    else if (item.s === 2 && isStep1Valid) setStep(2);
                    else if (item.s === 3 && isStep1Valid && isStep2Valid) setStep(3);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                    isCompleted
                      ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : isActive
                      ? 'bg-gradient-to-br from-action-blue to-glacier-blue border-action-blue text-white shadow-[0_0_12px_rgba(0,107,255,0.3)]'
                      : 'bg-card border-white/10 text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                </button>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${
                    isActive || isCompleted ? 'text-foreground font-extrabold' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm font-semibold text-action-blue">
          Bước {step}/3: {STEP_TITLES[step - 1]}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold brand-heading mt-1">Đặt dịch vụ</h1>
      </div>
    </div>
  );
}

