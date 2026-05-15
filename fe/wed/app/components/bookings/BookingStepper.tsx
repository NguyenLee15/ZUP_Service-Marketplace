'use client';

import React from 'react';
import { BookingStatus } from '@/types';
import { Check, Clock, FileText, CalendarCheck, PenTool as Tool, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface BookingStepperProps {
  currentStatus: BookingStatus;
}

export function BookingStepper({ currentStatus }: BookingStepperProps) {
  const steps = [
    { status: BookingStatus.PENDING, label: 'Đã gửi yêu cầu', icon: Clock },
    { status: BookingStatus.QUOTED, label: 'Đã báo giá', icon: FileText },
    { status: BookingStatus.CONFIRMED, label: 'Đã xác nhận', icon: CalendarCheck },
    { status: BookingStatus.IN_PROGRESS, label: 'Đang thực hiện', icon: Tool },
    { status: BookingStatus.DONE, label: 'Hoàn thành', icon: CheckCircle2 },
  ];

  // Nếu bị hủy hoặc tranh chấp, chúng ta hiển thị trạng thái đó riêng biệt
  const isCancelled = currentStatus === BookingStatus.CANCELLED;
  const isDisputed = currentStatus === BookingStatus.DISPUTED;

  const currentStepIndex = steps.findIndex(s => s.status === currentStatus);
  const activeIndex = currentStepIndex === -1 && !isCancelled && !isDisputed ? 0 : currentStepIndex;

  return (
    <div className="w-full py-8 px-2 overflow-x-auto scrollbar-hide">
      <div className="relative flex justify-between min-w-[500px]">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-muted z-0" />
        
        {/* Progress Line */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-action-blue transition-[width] duration-700 ease-out z-0"
          style={{ width: isCancelled || isDisputed ? '0%' : `${(activeIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center gap-3 flex-1">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-[background-color,border-color,color,box-shadow,transform] duration-300 border-2 ${
                  isCompleted 
                    ? 'bg-action-blue border-action-blue text-white shadow-[var(--brand-shadow-sm)]' 
                    : isActive 
                      ? 'bg-white border-action-blue text-action-blue shadow-[var(--brand-shadow-sm)] scale-110' 
                      : 'bg-white border-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="text-center space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  isActive ? 'text-action-blue' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
                {isActive && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-pale-gray text-action-blue text-[8px] font-bold animate-pulse">
                    HIỆN TẠI
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Exceptional States (CANCELLED / DISPUTED) */}
      {(isCancelled || isDisputed) && (
        <div className={`mt-8 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 ${
          isCancelled ? 'bg-pale-gray text-slate-blue' : 'bg-red-50 text-red-700'
        }`}>
          {isCancelled ? <XCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest">
              {isCancelled ? 'Đơn hàng đã hủy' : 'Đơn hàng đang tranh chấp'}
            </p>
            <p className="text-xs opacity-80">
              {isCancelled 
                ? 'Đơn hàng này không còn hiệu lực.' 
                : 'Đang chờ Admin xử lý khiếu nại của bạn.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
