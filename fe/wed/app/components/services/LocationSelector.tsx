'use client';

import React, { useState } from 'react';
import { Check, MapPin, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const COMMON_LOCATIONS = [
  { label: 'Hà Nội', lat: 21.0285, lng: 105.8522 },
  { label: 'Quận Ba Đình, Hà Nội', lat: 21.0336, lng: 105.8277 },
  { label: 'Quận Cầu Giấy, Hà Nội', lat: 21.0285, lng: 105.7951 },
  { label: 'Quận Đống Đa, Hà Nội', lat: 21.0182, lng: 105.8242 },
  { label: 'Quận Hai Bà Trưng, Hà Nội', lat: 21.0094, lng: 105.8520 },
  { label: 'Quận Hoàn Kiếm, Hà Nội', lat: 21.0288, lng: 105.8526 },
  { label: 'Quận Hoàng Mai, Hà Nội', lat: 20.9765, lng: 105.8505 },
  { label: 'Hồ Chí Minh', lat: 10.8231, lng: 106.6297 },
  { label: 'Quận 1, TP.HCM', lat: 10.7769, lng: 106.7009 },
  { label: 'Quận 3, TP.HCM', lat: 10.7818, lng: 106.6853 },
  { label: 'Quận Gò Vấp, TP.HCM', lat: 10.8286, lng: 106.6713 },
  { label: 'TP. Thủ Đức, TP.HCM', lat: 10.8496, lng: 106.7561 },
  { label: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { label: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
  { label: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
];

interface LocationSelectorProps {
  currentSource: 'gps' | 'manual' | 'fallback';
  currentLabel: string;
  onSelectManual: (lat: number, lng: number, label: string) => void;
  onSelectGps: () => void;
}

export function LocationSelector({
  currentSource,
  currentLabel,
  onSelectManual,
  onSelectGps,
}: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = COMMON_LOCATIONS.filter(loc => 
    loc.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="h-12 border-platinum-tint rounded-xl hover:bg-pale-gray hover:text-action-blue flex items-center gap-2 px-4 shadow-sm"
        >
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-slate-blue max-w-[140px] truncate">
            {currentSource === 'gps' ? 'Vị trí của tôi' : currentLabel}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border-platinum-tint overflow-hidden" align="end">
        <div className="p-4 border-b border-platinum-tint bg-pale-gray/50">
          <h4 className="font-bold text-midnight-indigo mb-3 text-sm">Chọn khu vực tìm kiếm</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Nhập tên quận/huyện..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-platinum-tint rounded-lg focus-visible:ring-action-blue/20 h-10"
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
          {search === '' && (
            <>
              <button
                type="button"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  currentSource === 'gps' ? 'bg-action-blue/5 text-action-blue' : 'hover:bg-pale-gray text-slate-blue'
                }`}
                onClick={() => {
                  onSelectGps();
                  setOpen(false);
                }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSource === 'gps' ? 'bg-action-blue/10' : 'bg-white border border-platinum-tint'}`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Vị trí của tôi</p>
                  <p className="text-xs text-muted-foreground">Sử dụng định vị thiết bị</p>
                </div>
                {currentSource === 'gps' && <Check className="w-4 h-4 text-action-blue" />}
              </button>
              
              <div className="h-px bg-platinum-tint mx-2 my-1" />
            </>
          )}

          {filtered.length > 0 ? (
            filtered.map((loc) => {
              const isSelected = currentSource === 'manual' && currentLabel === loc.label;
              return (
                <button
                  key={loc.label}
                  type="button"
                  onClick={() => {
                    onSelectManual(loc.lat, loc.lng, loc.label);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isSelected ? 'bg-action-blue/5 text-action-blue font-bold' : 'hover:bg-pale-gray text-slate-blue font-medium'
                  }`}
                >
                  <span className="flex-1 text-sm">{loc.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-action-blue" />}
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Không tìm thấy khu vực nào
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
