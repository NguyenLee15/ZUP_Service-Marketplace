'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DisputeLightboxModalProps {
  url: string | null;
  onClose: () => void;
}

export function DisputeLightboxModal({ url, onClose }: DisputeLightboxModalProps) {
  return (
    <Dialog open={!!url} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl bg-black/95 border-neutral-800 p-4 text-white">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-sm font-semibold text-white">
            Bằng chứng tranh chấp
          </DialogTitle>
        </DialogHeader>
        {url && (
          <div className="flex items-center justify-center max-h-[80vh]">
            <img
              src={url}
              alt="Bằng chứng tranh chấp"
              className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

