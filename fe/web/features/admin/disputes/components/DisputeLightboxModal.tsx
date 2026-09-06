'use client';

import React from 'react';

interface DisputeLightboxModalProps {
  url: string | null;
  onClose: () => void;
}

export function DisputeLightboxModal({ url, onClose }: DisputeLightboxModalProps) {
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
    >
      <img
        src={url}
        alt="Bằng chứng tranh chấp"
        className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
      />
    </div>
  );
}

