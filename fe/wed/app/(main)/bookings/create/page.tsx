'use client';

import { useState, useEffect, Suspense } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { servicesApi, bookingsApi } from '@/features/auth/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Clock, TrendingUp, MapPin, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DynamicQuestionnaire } from '@/app/components/bookings/DynamicQuestionnaire';
import { userApi } from '@/features/user/services/user.api';

type AddressMode = 'default' | 'custom';

interface UserAddress {
  id: number;
  label?: string | null;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  isDefault: boolean;
}

function normalizeAddresses(payload: unknown): UserAddress[] {
  const response = payload as { data?: { data?: unknown } };
  const data = response.data?.data;
  return Array.isArray(data) ? (data as UserAddress[]) : [];
}

export default function CreateBookingPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-6"><div className="h-96 bg-muted rounded-xl animate-pulse" /></div>}>
      <CreateBookingContent />
    </Suspense>
  );
}

function CreateBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const serviceId = searchParams.get('serviceId');
  const reorderId = searchParams.get('reorderId');

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressMode, setAddressMode] = useState<AddressMode>('custom');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [description, setDescription] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [desiredTime, setDesiredTime] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const defaultAddress = addresses.find((address) => address.isDefault);

  const clearAddressErrors = () => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.province;
      delete next.district;
      delete next.ward;
      delete next.addressDetail;
      return next;
    });
  };

  const applyAddress = (address: UserAddress) => {
    setProvince(address.province);
    setDistrict(address.district);
    setWard(address.ward);
    setAddressDetail(address.addressDetail);
    setSelectedAddressId(address.id);
    clearAddressErrors();
  };

  const useCustomAddress = () => {
    setAddressMode('custom');
    setSelectedAddressId(null);
    setProvince('');
    setDistrict('');
    setWard('');
    setAddressDetail('');
  };

  const validate = (name: string, value: string) => {
    const newErrors = { ...fieldErrors };
    if (name === 'description') {
      if (!value) newErrors.description = 'Vui lòng mô tả yêu cầu';
      else if (value.length < 10) newErrors.description = 'Mô tả quá ngắn (tối thiểu 10 ký tự)';
      else delete newErrors.description;
    }
    if (['province', 'district', 'ward', 'addressDetail'].includes(name)) {
      if (!value) newErrors[name] = 'Bắt buộc';
      else delete newErrors[name];
    }
    if (name === 'desiredTime') {
      const selectedDate = new Date(value);
      if (isNaN(selectedDate.getTime())) newErrors.desiredTime = 'Thời gian không hợp lệ';
      else if (selectedDate < new Date()) newErrors.desiredTime = 'Thời gian phải ở tương lai';
      else delete newErrors.desiredTime;
    }
    setFieldErrors(newErrors);
  };

  useEffect(() => {
    if (!serviceId) return;
    servicesApi.getDetail(Number(serviceId)).then((res) => setService(res.data.data)).catch(() => router.push('/services'));

    if (reorderId) {
      bookingsApi.getById(Number(reorderId)).then((res) => {
        const old = res.data.data;
        if (old) {
          setDescription(old.description || '');
          setAddressMode('custom');
          setSelectedAddressId(null);
          setProvince(old.province || '');
          setDistrict(old.district || '');
          setWard(old.ward || '');
          setAddressDetail(old.addressDetail || '');
        }
      }).catch(console.error);
    }
  }, [serviceId, reorderId]);

  useEffect(() => {
    let cancelled = false;

    userApi
      .getAddresses()
      .then((response) => {
        if (cancelled) return;
        const normalized = normalizeAddresses(response);
        setAddresses(normalized);

        const preferred = normalized.find((address) => address.isDefault);
        if (!reorderId && preferred) {
          setAddressMode('default');
          applyAddress(preferred);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddresses([]);
          setAddressMode('custom');
        }
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reorderId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await bookingsApi.create({
        serviceId: Number(serviceId),
        description,
        province,
        district,
        ward,
        addressDetail,
        desiredTime: new Date(desiredTime).toISOString(),
      });
      toast({ title: 'Đặt dịch vụ thành công', description: 'Nhà cung cấp sẽ liên hệ bạn sớm.' });
      router.push('/bookings');
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message || 'Đã xảy ra lỗi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm font-semibold text-action-blue">Bước 1/3</p>
        <h1 className="text-2xl sm:text-3xl font-bold brand-heading mt-1">Đặt dịch vụ</h1>
        <p className="text-sm text-muted-foreground mt-2">Mô tả nhu cầu, địa chỉ và khung giờ mong muốn để nhà cung cấp xác nhận lịch.</p>
      </div>

      {service && (
        <Card className="surface-card mb-6 rounded-[20px] py-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-pale-gray flex items-center justify-center text-2xl shrink-0 overflow-hidden">
              {service.images?.[0]?.imageUrl ? (
                <img src={service.images[0].imageUrl} alt={service.name} loading="lazy" className="w-full h-full object-cover" />
              ) : '🔧'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{service.name}</h3>
              <p className="text-sm text-muted-foreground">{service.provider?.fullName}</p>
              <p className="text-sm font-semibold text-action-blue mt-0.5">
                Giá tham khảo: {formatPrice(Number(service.referencePrice))}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="surface-card space-y-2 p-4 sm:p-6 rounded-[20px]">
          <DynamicQuestionnaire 
            serviceName={service?.name || ''}
            description={description}
            onChange={(val) => {
              setDescription(val);
              validate('description', val);
            }}
            error={fieldErrors.description}
          />

        </div>

        <div className="surface-card space-y-4 rounded-[20px] p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label>Địa chỉ thực hiện *</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Mặc định lấy từ Quản lý địa chỉ, hoặc nhập địa chỉ khác cho lần đặt này.
              </p>
            </div>
            {selectedAddressId && addressMode === 'default' && (
              <Badge className="w-fit border-0 bg-green-100 text-green-700">Đang dùng mặc định</Badge>
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
              className={`rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${
                addressMode === 'default'
                  ? 'border-action-blue bg-action-blue/5 shadow-sm'
                  : 'border-platinum-tint bg-white hover:bg-pale-gray/50'
              } ${!defaultAddress ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-action-blue" />
                <span className="text-sm font-bold text-foreground">Địa chỉ mặc định</span>
              </div>
              {addressesLoading ? (
                <p className="text-xs text-muted-foreground">Đang tải địa chỉ…</p>
              ) : defaultAddress ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {defaultAddress.label || 'Địa chỉ mặc định'}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {defaultAddress.addressDetail}, {defaultAddress.ward}, {defaultAddress.district}, {defaultAddress.province}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Bạn chưa có địa chỉ mặc định. Hãy nhập địa chỉ khác bên cạnh.
                </p>
              )}
            </button>

            <button
              type="button"
              onClick={useCustomAddress}
              className={`rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${
                addressMode === 'custom'
                  ? 'border-action-blue bg-action-blue/5 shadow-sm'
                  : 'border-platinum-tint bg-white hover:bg-pale-gray/50'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Plus className="h-4 w-4 text-action-blue" />
                <span className="text-sm font-bold text-foreground">Nhập địa chỉ khác</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Dùng khi bạn muốn thợ đến địa điểm khác với địa chỉ mặc định.
              </p>
            </button>
          </div>

          {addressMode === 'custom' && (
            <div className="space-y-4 border-t border-platinum-tint pt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="booking-province">Tỉnh/Thành *</Label>
                  <Input id="booking-province" name="province" autoComplete="address-level1" value={province} onChange={(e) => {
                    setProvince(e.target.value);
                    validate('province', e.target.value);
                  }} placeholder="TP. Hồ Chí Minh" className={fieldErrors.province ? 'border-red-500' : ''} />
                  {fieldErrors.province && <p className="text-red-500 text-[10px]">{fieldErrors.province}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-district">Quận/Huyện *</Label>
                  <Input id="booking-district" name="district" autoComplete="address-level2" value={district} onChange={(e) => {
                    setDistrict(e.target.value);
                    validate('district', e.target.value);
                  }} placeholder="Quận 1" className={fieldErrors.district ? 'border-red-500' : ''} />
                  {fieldErrors.district && <p className="text-red-500 text-[10px]">{fieldErrors.district}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-ward">Phường/Xã *</Label>
                  <Input id="booking-ward" name="ward" autoComplete="address-level3" value={ward} onChange={(e) => {
                    setWard(e.target.value);
                    validate('ward', e.target.value);
                  }} placeholder="Phường Bến Thành" className={fieldErrors.ward ? 'border-red-500' : ''} />
                  {fieldErrors.ward && <p className="text-red-500 text-[10px]">{fieldErrors.ward}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-address-detail">Địa chỉ chi tiết *</Label>
                <Input id="booking-address-detail" name="addressDetail" autoComplete="street-address" value={addressDetail} onChange={(e) => {
                  setAddressDetail(e.target.value);
                  validate('addressDetail', e.target.value);
                }}
                  placeholder="Số nhà, tên đường…" className={fieldErrors.addressDetail ? 'border-red-500' : ''} />
                {fieldErrors.addressDetail && <p className="text-red-500 text-[10px]">{fieldErrors.addressDetail}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="surface-card space-y-2 rounded-[20px] p-4 sm:p-6">
          <Label htmlFor="booking-desired-time">Thời gian mong muốn *</Label>
          <Input id="booking-desired-time" name="desiredTime" autoComplete="off" type="datetime-local" value={desiredTime} onChange={(e) => {
            setDesiredTime(e.target.value);
            validate('desiredTime', e.target.value);
          }}
            min={new Date().toISOString().slice(0, 16)} className={fieldErrors.desiredTime ? 'border-red-500' : ''} />
          {fieldErrors.desiredTime && <p className="text-red-500 text-[10px]">{fieldErrors.desiredTime}</p>}

          {/* AI Scheduling Hints */}
          <div className="mt-4 p-4 rounded-[20px] bg-pale-gray/55 border border-platinum-tint relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 rotate-12 transition-transform group-hover:scale-110">
              <Sparkles className="w-12 h-12 text-action-blue" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-action-blue" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-blue">Gợi ý lịch hẹn</span>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  const value = tomorrow.toISOString().slice(0, 16);
                  setDesiredTime(value);
                  validate('desiredTime', value);
                }}
                className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-white/80 hover:bg-white rounded-xl border border-white cursor-pointer transition-[background-color,box-shadow] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">Sáng mai, 09:00</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">Khung giờ vàng - Thợ đang trống lịch gần đây</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white border-0 text-[9px] sm:text-[10px] font-bold uppercase self-start sm:self-auto">-10% phí</Badge>
              </button>

              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  now.setHours(now.getHours() + 2);
                  const value = now.toISOString().slice(0, 16);
                  setDesiredTime(value);
                  validate('desiredTime', value);
                }}
                className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-white/80 hover:bg-white rounded-xl border border-white cursor-pointer transition-[background-color,box-shadow] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-pale-gray text-action-blue rounded-lg shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">Hôm nay, trong 2 giờ tới</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">Phản hồi siêu tốc - Ưu tiên nhận đơn</p>
                  </div>
                </div>
                <Badge className="bg-action-blue text-white border-0 text-[9px] sm:text-[10px] font-bold uppercase self-start sm:self-auto">Ưu tiên</Badge>
              </button>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading || !description || !province || !desiredTime || Object.keys(fieldErrors).length > 0}
          className="w-full h-12 bg-action-blue hover:bg-glacier-blue text-white font-semibold text-base shadow-[var(--brand-shadow-button)]">
          {loading ? 'Đang xử lý…' : 'Xác nhận đặt dịch vụ'}
        </Button>
      </form>
    </div>
  );
}
