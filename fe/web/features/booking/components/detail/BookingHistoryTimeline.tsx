'use client';

import React from 'react';
import { History } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { STATUS_LABELS } from '@/features/booking/hooks/useBookingDetailFlow';

interface BookingHistoryTimelineProps {
  statusHistory: ApiPayload[];
  formatDate: (d: string) => string;
}

export function BookingHistoryTimeline({
  statusHistory,
  formatDate,
}: BookingHistoryTimelineProps) {
  if (!statusHistory || statusHistory.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="history" className="border-none glass-panel rounded-2xl px-4">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <History className="w-4 h-4" />
            Lịch sử trạng thái chi tiết
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4 space-y-4">
          <div className="relative pl-4 border-l-2 border-action-blue/30 space-y-6">
            {statusHistory.map((h: ApiPayload, i: number) => (
              <div key={i} className="relative">
                <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-card border-2 border-action-blue shadow-[0_0_6px_rgba(0,107,255,0.3)]" />
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-tight text-foreground">
                      {STATUS_LABELS[h.toStatus] || h.toStatus}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatDate(h.createdAt)}
                    </span>
                  </div>
                  {h.note && (
                    <p className="text-[11px] text-muted-foreground italic">
                      &quot;{h.note}&quot;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

