'use client';

import React, { useState } from 'react';
import { Check, MapPin, Search, Home, Briefcase } from 'lucide-react';
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
  currentSource: 'gps' | 'manual' | 'fallback' | 'all';
  currentLabel: string;
  savedAddresses?: any[];
  onSelectManual: (lat: number, lng: number, label: string) => void;
  onSelectGps: () => void;
  onClearLocation: () => void;
}

export function LocationSelector({
  currentSource,
  currentLabel,
  savedAddresses = [],
  onSelectManual,
  onSelectGps,
  onClearLocation,
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
            {currentSource === 'gps' ? 'Vị trí của tôi' : currentSource === 'all' ? 'Toàn quốc' : currentLabel}
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

              <button
                type="button"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  currentSource === 'all' ? 'bg-action-blue/5 text-action-blue' : 'hover:bg-pale-gray text-slate-blue'
                }`}
                onClick={() => {
                  onClearLocation();
                  setOpen(false);
                }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSource === 'all' ? 'bg-action-blue/10' : 'bg-white border border-platinum-tint'}`}>
                  <Search className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Toàn quốc</p>
                  <p className="text-xs text-muted-foreground">Tìm kiếm trên toàn quốc</p>
                </div>
                {currentSource === 'all' && <Check className="w-4 h-4 text-action-blue" />}
              </button>
              
              <div className="h-px bg-platinum-tint mx-2 my-1" />

              {savedAddresses.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Địa chỉ đã lưu
                  </div>
                  {savedAddresses.map((address) => {
                    const label = address.label || address.addressDetail || 'Địa chỉ đã lưu';
                    const isSelected = currentSource === 'manual' && currentLabel === label;
                    const isHome = label.toLowerCase().includes('nhà');
                    const isOffice = label.toLowerCase().includes('văn phòng') || label.toLowerCase().includes('cơ quan') || label.toLowerCase().includes('công ty');
                    
                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => {
                          const match = COMMON_LOCATIONS.find(loc => 
                            address.province?.toLowerCase().includes(loc.label.toLowerCase()) || 
                            loc.label.toLowerCase().includes(address.province?.toLowerCase() || '') ||
                            (address.province?.toLowerCase().includes('hồ chí minh') && loc.label === 'Hồ Chí Minh')
                          );
                          const lat = match ? match.lat : COMMON_LOCATIONS[0].lat;
                          const lng = match ? match.lng : COMMON_LOCATIONS[0].lng;
                          onSelectManual(lat, lng, label);
                          setOpen(false);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-action-blue/5 text-action-blue' : 'hover:bg-pale-gray text-slate-blue'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-action-blue/10 flex items-center justify-center text-action-blue">
                          {isHome ? <Home className="w-4 h-4" /> : isOffice ? <Briefcase className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold">{label}</p>
                            {address.isDefault && (
                              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                                MẶC ĐỊNH
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {[address.addressDetail, address.ward, address.district, address.province].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-action-blue" />}
                      </button>
                    );
                  })}
                  <div className="h-px bg-platinum-tint mx-2 mt-2" />
                </div>
              )}
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
