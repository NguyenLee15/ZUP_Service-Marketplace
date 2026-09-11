'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ServiceImageGalleryProps {
  images: Array<{ imageUrl: string }>;
  currentImage: number;
  onSelectImage: (index: number) => void;
  serviceName: string;
}

export function ServiceImageGallery({
  images,
  currentImage,
  onSelectImage,
  serviceName,
}: ServiceImageGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <div className="aspect-[16/9] rounded-[20px] bg-pale-gray flex items-center justify-center text-6xl text-slate-blue mb-6 border border-platinum-tint">
        🔧
      </div>
    );
  }

  return (
    <div className="relative rounded-[20px] overflow-hidden bg-muted mb-6 border border-platinum-tint shadow-[var(--brand-shadow-card)]">
      <div className="aspect-[16/9]">
        <Image
          src={images[currentImage]?.imageUrl}
          alt={serviceName}
          width={800}
          height={450}
          priority
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <>
          <button
            aria-label="Xem ảnh trước"
            onClick={() =>
              onSelectImage(
                currentImage === 0 ? images.length - 1 : currentImage - 1,
              )
            }
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 sm:p-2 bg-midnight-indigo/55 hover:bg-midnight-indigo/75 rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
          >
            <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
          <button
            aria-label="Xem ảnh tiếp theo"
            onClick={() =>
              onSelectImage(
                currentImage === images.length - 1 ? 0 : currentImage + 1,
              )
            }
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2 bg-midnight-indigo/55 hover:bg-midnight-indigo/75 rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
          >
            <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`Xem ảnh ${i + 1}`}
                onClick={() => onSelectImage(i)}
                className={`w-2 h-2 rounded-full transition ${
                  i === currentImage ? 'bg-white scale-125' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

