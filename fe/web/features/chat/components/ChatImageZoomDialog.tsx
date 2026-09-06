'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ChatImageZoomDialogProps {
  zoomedImage: string | null;
  setZoomedImage: (url: string | null) => void;
}

export function ChatImageZoomDialog({
  zoomedImage,
  setZoomedImage,
}: ChatImageZoomDialogProps) {
  return (
    <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-1 flex justify-center items-center bg-black/90 border-none sm:max-w-screen-lg">
        <DialogTitle className="sr-only">Phóng to hình ảnh</DialogTitle>
        {zoomedImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-[85vh] object-contain rounded-md"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

