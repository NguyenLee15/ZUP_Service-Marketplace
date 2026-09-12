"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, RotateCw, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KycDocument } from "../types/kyc.types";

interface KycImageViewerProps {
  documents: KycDocument[];
  selectedImage: string;
  selectedLabel: string;
  onSelectDocument: (doc: KycDocument) => void;
}

export function KycImageViewer({
  documents,
  selectedImage,
  selectedLabel,
  onSelectDocument,
}: KycImageViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 250));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-bold text-slate-800">
              Tài liệu xác thực: {selectedLabel}
            </CardTitle>

            {/* Viewer Controls */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleZoomIn}
                title="Phóng to"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleZoomOut}
                title="Thu nhỏ"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleRotate}
                title="Xoay 90 độ"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2"
                onClick={handleReset}
              >
                {zoom}%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setLightboxOpen(true)}
                title="Xem toàn màn hình"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Document Selectors */}
          <div className="flex flex-wrap gap-2">
            {documents.map((doc) => {
              const active = doc.url === selectedImage;
              return (
                <button
                  key={doc.label}
                  type="button"
                  onClick={() => {
                    onSelectDocument(doc);
                    handleReset();
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{doc.icon}</span>
                  <span>{doc.label}</span>
                </button>
              );
            })}
          </div>

          {/* Image Display Area */}
          <div className="relative h-[420px] w-full overflow-hidden rounded-xl border bg-slate-950/5 flex items-center justify-center">
            {selectedImage ? (
              <div
                className="transition-transform duration-200 flex items-center justify-center max-h-full max-w-full"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
              >
                <Image
                  src={selectedImage}
                  alt={selectedLabel}
                  width={600}
                  height={400}
                  unoptimized
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-md select-none"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-400">Không có hình ảnh tài liệu</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Lightbox Modal */}
      <Dialog open={lightboxOpen && !!selectedImage} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl bg-black/95 border-neutral-800 p-4 text-white">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-sm font-semibold text-white">
              {selectedLabel}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[80vh]">
            <Image
              src={selectedImage}
              alt={selectedLabel}
              width={1000}
              height={700}
              unoptimized
              className="max-h-[75vh] w-auto object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

