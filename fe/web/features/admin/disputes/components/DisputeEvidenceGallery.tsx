'use client';

import React from 'react';
import { AlertTriangle, Camera, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DisputeDetailData } from '../types/dispute-detail.types';

interface DisputeEvidenceGalleryProps {
  dispute: DisputeDetailData;
  onOpenLightbox: (url: string) => void;
}

export function DisputeEvidenceGallery({ dispute, onOpenLightbox }: DisputeEvidenceGalleryProps) {
  const customerName = dispute.booking?.customer?.fullName || 'Ẩn danh';

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Nội dung khiếu nại
            </CardTitle>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Khách hàng: <strong className="text-slate-600">{customerName}</strong>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
          <p className="text-sm font-medium leading-relaxed text-slate-800">
            {dispute.reason}
          </p>
        </div>

        {dispute.evidences?.length > 0 && (
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Camera className="h-3.5 w-3.5" />
              Bằng chứng khách hàng ({dispute.evidences.length})
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {dispute.evidences.map((ev, i) => (
                <button
                  key={ev.id || i}
                  type="button"
                  onClick={() => onOpenLightbox(ev.fileUrl)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 transition-all hover:border-blue-300 hover:shadow-md"
                >
                  {ev.type === 'VIDEO' ? (
                    <video src={ev.fileUrl} className="h-full w-full object-cover" />
                  ) : (
                    <img
                      src={ev.fileUrl}
                      alt={`Bằng chứng ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                    <ImageIcon className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

