'use client';

import React from 'react';
import { Check, Locate, Loader2, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatAdministrativeArea } from '@/lib/address-options';
import type { AddressMode, UserAddress } from '@/features/booking/hooks/useCreateBookingFlow';

interface BookingAddressSelectorProps {
  addressMode: AddressMode;
  setAddressMode: (mode: AddressMode) => void;
  selectedAddressId: number | null;
  defaultAddress?: UserAddress;
  addressesLoading: boolean;
  addressOptionsLoading: boolean;
  addressOptionsFallback: boolean;
  applyAddress: (address: UserAddress) => void;
  useCustomAddress: () => void;
  gpsLoading: boolean;
  handleAutoLocate: () => void;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  setAddressDetail: (val: string) => void;
  fieldErrors: Record<string, string>;
  validate: (name: string, val: string) => void;
  handleProvinceChange: (val: string) => void;
  handleWardChange: (val: string) => void;
  provinceOptions: string[];
  wardOptions: string[];
}

export function BookingAddressSelector({
  addressMode,
  setAddressMode,
  selectedAddressId,
  defaultAddress,
  addressesLoading,
  addressOptionsLoading,
  addressOptionsFallback,
  applyAddress,
  useCustomAddress,
  gpsLoading,
  handleAutoLocate,
  province,
  district,
  ward,
  addressDetail,
  setAddressDetail,
  fieldErrors,
  validate,
  handleProvinceChange,
  handleWardChange,
  provinceOptions,
  wardOptions,
}: BookingAddressSelectorProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="rounded-xl border border-border bg-card space-y-4 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label className="text-foreground font-semibold">Địa chỉ thực hiện *</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Chọn địa chỉ mặc định, kiểm tra quyền vị trí hoặc điền thủ công.
            </p>
            {addressOptionsLoading && (
              <p className="mt-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                Đang tải danh sách địa giới hành chính…
              </p>
            )}
            {addressOptionsFallback && !addressOptionsLoading && (
              <p className="mt-1 text-[11px] font-medium text-amber-500">
                Tạm dùng danh sách địa giới rút gọn. Vui lòng kiểm tra kỹ địa chỉ.
              </p>
            )}
          </div>
          {selectedAddressId && addressMode === 'default' && (
            <Badge className="w-fit border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold text-[10px]">
              Mặc định
            </Badge>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            disabled={!defaultAddress}
            onClick={() => {
              if (!defaultAddress) return;
              setAddressMode('default');
              applyAddress(defaultAddress);
            }}
            className={`rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer ${
              addressMode === 'default'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 shadow-sm'
                : 'border-border bg-background hover:bg-muted/40'
            } ${!defaultAddress ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span className="text-sm font-bold text-foreground">Địa chỉ mặc định</span>
            </div>
            {addressesLoading ? (
              <p className="text-xs text-muted-foreground animate-pulse">Đang tải địa chỉ…</p>
            ) : defaultAddress ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  {defaultAddress.label || 'Địa chỉ mặc định'}
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {defaultAddress.addressDetail},{' '}
                  {formatAdministrativeArea(
                    defaultAddress.province,
                    defaultAddress.ward,
                    defaultAddress.district
                  )}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Bạn chưa có địa chỉ mặc định.</p>
            )}
          </button>

          <button
            type="button"
            onClick={useCustomAddress}
            className={`rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer ${
              addressMode === 'custom'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 shadow-sm'
                : 'border-border bg-background hover:bg-muted/40'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <Plus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span className="text-sm font-bold text-foreground">Địa điểm khác</span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Điền vị trí thủ công hoặc kiểm tra quyền vị trí hiện tại.
            </p>
          </button>
        </div>

        {/* Real geolocation permission check */}
        <div className="border border-border bg-muted/20 p-4 rounded-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Locate className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Hỗ trợ vị trí hiện tại
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Kiểm tra quyền vị trí, sau đó bạn vẫn cần nhập địa chỉ chính xác.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoLocate}
              disabled={gpsLoading}
              className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              {gpsLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang định vị…
                </>
              ) : (
                <>
                  <Locate className="w-3.5 h-3.5" />
                  Kiểm tra vị trí
                </>
              )}
            </Button>
          </div>

          <div className="h-24 bg-background rounded-lg border border-border flex items-center justify-center relative overflow-hidden">
            {gpsLoading ? (
              <div className="flex flex-col items-center gap-2">
                <span className="relative flex h-7 w-7">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-7 w-7 bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
                    <Locate className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  </span>
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground animate-pulse">
                  Đang kiểm tra quyền vị trí…
                </span>
              </div>
            ) : province ? (
              <div className="text-center p-3 z-10 space-y-1">
                <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Địa chỉ đang được nhập
                  </span>
                </div>
                <p className="text-xs font-bold text-foreground truncate max-w-[280px]">
                  {addressDetail || 'Chưa điền số nhà'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">
                  {ward}, {district}, {province}
                </p>
              </div>
            ) : (
              <div className="text-center p-3 text-muted-foreground z-10">
                <MapPin className="w-5 h-5 text-muted-foreground/60 mx-auto mb-1" />
                <p className="text-xs font-medium text-foreground">Tọa độ chưa xác định</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Nhập thủ công để thợ đến đúng địa điểm
                </p>
              </div>
            )}
          </div>
        </div>

        {addressMode === 'custom' && (
          <div className="space-y-4 border-t border-border pt-4 animate-in fade-in duration-300">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-province">Tỉnh/Thành *</Label>
                <Select name="province" value={province} onValueChange={handleProvinceChange}>
                  <SelectTrigger
                    id="booking-province"
                    className={`h-11 w-full rounded-xl bg-background text-foreground border-input shadow-sm ${
                      fieldErrors.province ? 'border-destructive' : ''
                    }`}
                    aria-invalid={!!fieldErrors.province}
                  >
                    <SelectValue placeholder="Chọn tỉnh/thành" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {provinceOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.province && (
                  <p className="text-red-500 text-[10px]">{fieldErrors.province}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-ward">Phường/Xã/Đặc khu *</Label>
                <Select
                  name="ward"
                  value={ward}
                  onValueChange={handleWardChange}
                  disabled={!province}
                >
                  <SelectTrigger
                    id="booking-ward"
                    className={`h-11 w-full rounded-xl bg-background text-foreground border-input shadow-sm ${
                      fieldErrors.ward ? 'border-destructive' : ''
                    }`}
                    aria-invalid={!!fieldErrors.ward}
                  >
                    <SelectValue
                      placeholder={province ? 'Chọn phường/xã/đặc khu' : 'Chọn tỉnh trước'}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {wardOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.ward && <p className="text-destructive text-[10px]">{fieldErrors.ward}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-address-detail">Địa chỉ chi tiết *</Label>
              <Input
                id="booking-address-detail"
                name="addressDetail"
                autoComplete="street-address"
                value={addressDetail}
                onChange={(e) => {
                  setAddressDetail(e.target.value);
                  validate('addressDetail', e.target.value);
                }}
                placeholder="Số nhà, tên đường…"
                className={`bg-background border-input text-foreground ${
                  fieldErrors.addressDetail ? 'border-destructive' : ''
                }`}
              />
              {fieldErrors.addressDetail && (
                <p className="text-destructive text-[10px]">{fieldErrors.addressDetail}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

