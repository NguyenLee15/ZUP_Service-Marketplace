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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatAdministrativeArea,
  getProvinceOptions,
  getWardOptions,
  NEW_ADMIN_DISTRICT_VALUE,
  withCurrentOption,
} from '@/lib/address-options';
import { useAddressOptions } from '@/hooks/use-address-options';

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
  const { addressOptions, loading: addressOptionsLoading, fallback: addressOptionsFallback } = useAddressOptions();
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
  const [district, setDistrict] = useState(NEW_ADMIN_DISTRICT_VALUE);
  const [ward, setWard] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [desiredTime, setDesiredTime] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedItems, setSelectedItems] = useState<Record<number, { serviceItemId: number; quantity: number; name: string; price: number; unit: string }>>({});
  const defaultAddress = addresses.find((address) => address.isDefault);
  const provinceOptions = withCurrentOption(getProvinceOptions(addressOptions), province);
  const wardOptions = withCurrentOption(getWardOptions(province, addressOptions), ward);

  const clearAddressErrors = () => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.province;
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
    setDistrict(NEW_ADMIN_DISTRICT_VALUE);
    setWard('');
    setAddressDetail('');
  };

  const validate = (name: string, value: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (name === 'description') {
        if (!value) newErrors.description = 'Vui lòng mô tả yêu cầu';
        else if (value.length < 10) newErrors.description = 'Mô tả quá ngắn (tối thiểu 10 ký tự)';
        else delete newErrors.description;
      }
      if (['province', 'ward', 'addressDetail'].includes(name)) {
        if (!value) newErrors[name] = 'Bắt buộc';
        else delete newErrors[name];
      }
      if (name === 'desiredTime') {
        const selectedDate = new Date(value);
        if (isNaN(selectedDate.getTime())) newErrors.desiredTime = 'Thời gian không hợp lệ';
        else if (selectedDate < new Date()) newErrors.desiredTime = 'Thời gian phải ở tương lai';
        else delete newErrors.desiredTime;
      }
      return newErrors;
    });
  };

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict(NEW_ADMIN_DISTRICT_VALUE);
    setWard('');
    validate('province', value);
    validate('ward', '');
  };

  const handleWardChange = (value: string) => {
    setWard(value);
    validate('ward', value);
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
      const itemsPayload = Object.values(selectedItems).map((it) => ({
        serviceItemId: it.serviceItemId,
        quantity: it.quantity,
      }));

      await bookingsApi.create({
        serviceId: Number(serviceId),
        description,
        province,
        district: district || NEW_ADMIN_DISTRICT_VALUE,
        ward,
        addressDetail,
        desiredTime: new Date(desiredTime).toISOString(),
        items: itemsPayload.length > 0 ? itemsPayload : undefined,
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
        <Card className="glass-panel glow-hover mb-6 rounded-[20px] py-0 text-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0 overflow-hidden shadow-sm">
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
        <div className="glass-panel glow-hover space-y-2 p-4 sm:p-6 rounded-[20px] text-white shadow-xl">
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

        {/* Chọn các dịch vụ con kèm theo */}
        {service?.items && service.items.length > 0 && (
          <div className="glass-panel glow-hover space-y-3 rounded-[20px] p-4 sm:p-6 text-white shadow-xl">
            <div>
              <Label className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-action-blue" />
                Chọn hạng mục dịch vụ cần làm
              </Label>
              <p className="text-[10px] text-muted-foreground mt-1">
                Tích chọn những hạng mục bạn cần thợ thực hiện. Có thể tùy chỉnh số lượng.
              </p>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {service.items.map((item: any) => {
                const isSelected = !!selectedItems[item.id];
                const qty = selectedItems[item.id]?.quantity || 1;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-action-blue bg-action-blue/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems((prev) => ({
                              ...prev,
                              [item.id]: {
                                serviceItemId: item.id,
                                quantity: 1,
                                name: item.name,
                                price: Number(item.price),
                                unit: item.unit,
                              },
                            }));
                          } else {
                            setSelectedItems((prev) => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-action-blue focus:ring-action-blue focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="min-w-0 cursor-pointer" onClick={() => {
                        setSelectedItems((prev) => {
                          if (isSelected) {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                          } else {
                            return {
                              ...prev,
                              [item.id]: {
                                serviceItemId: item.id,
                                quantity: 1,
                                name: item.name,
                                price: Number(item.price),
                                unit: item.unit,
                              },
                            };
                          }
                        });
                      }}
                      >
                        <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatPrice(Number(item.price))} / {item.unit}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItems((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                quantity: Math.max(1, qty - 1),
                              },
                            }));
                          }}
                          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-white transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-6 text-center text-white">{qty}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItems((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                quantity: qty + 1,
                              },
                            }));
                          }}
                          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-white transition-colors"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {Object.keys(selectedItems).length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Tạm tính dịch vụ con:</span>
                <span className="text-sm font-bold text-cyan-300">
                  {formatPrice(
                    Object.values(selectedItems).reduce((sum, it) => sum + it.price * it.quantity, 0)
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="glass-panel glow-hover space-y-4 rounded-[20px] p-4 sm:p-6 text-white shadow-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label>Địa chỉ thực hiện *</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Mặc định lấy từ Quản lý địa chỉ, hoặc nhập địa chỉ khác cho lần đặt này.
              </p>
              {addressOptionsLoading && (
                <p className="mt-1 text-[11px] font-medium text-action-blue">
                  Đang tải danh sách tỉnh và phường/xã theo địa giới mới…
                </p>
              )}
              {addressOptionsFallback && !addressOptionsLoading && (
                <p className="mt-1 text-[11px] font-medium text-amber-600">
                  Tạm dùng danh sách rút gọn do chưa tải được dữ liệu địa giới mới.
                </p>
              )}
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
              className={`rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${
                addressMode === 'default'
                  ? 'border-action-blue bg-action-blue/10 shadow-sm'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              } ${!defaultAddress ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sky-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">Địa chỉ mặc định</span>
              </div>
              {addressesLoading ? (
                <p className="text-xs text-muted-foreground">Đang tải địa chỉ…</p>
              ) : defaultAddress ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {defaultAddress.label || 'Địa chỉ mặc định'}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {defaultAddress.addressDetail}, {formatAdministrativeArea(defaultAddress.province, defaultAddress.ward, defaultAddress.district)}
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
              className={`rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${
                addressMode === 'custom'
                  ? 'border-action-blue bg-action-blue/10 shadow-sm'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Plus className="h-4 w-4 text-sky-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">Nhập địa chỉ khác</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Dùng khi bạn muốn thợ đến địa điểm khác với địa chỉ mặc định.
              </p>
            </button>
          </div>

          {addressMode === 'custom' && (
            <div className="space-y-4 border-t border-white/10 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="booking-province">Tỉnh/Thành *</Label>
                  <Select name="province" value={province} onValueChange={handleProvinceChange}>
                    <SelectTrigger
                      id="booking-province"
                      className={`h-11 w-full rounded-xl bg-white/5 text-white border-white/10 shadow-sm ${fieldErrors.province ? 'border-red-500' : ''}`}
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
                  {fieldErrors.province && <p className="text-red-500 text-[10px]">{fieldErrors.province}</p>}
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
                      className={`h-11 w-full rounded-xl bg-white/5 text-white border-white/10 shadow-sm ${fieldErrors.ward ? 'border-red-500' : ''}`}
                      aria-invalid={!!fieldErrors.ward}
                    >
                      <SelectValue placeholder={province ? 'Chọn phường/xã/đặc khu' : 'Chọn tỉnh trước'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {wardOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.ward && <p className="text-red-500 text-[10px]">{fieldErrors.ward}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-address-detail">Địa chỉ chi tiết *</Label>
                <Input id="booking-address-detail" name="addressDetail" autoComplete="street-address" value={addressDetail} onChange={(e) => {
                  setAddressDetail(e.target.value);
                  validate('addressDetail', e.target.value);
                }}
                  placeholder="Số nhà, tên đường…" className={`bg-white/5 border-white/10 ${fieldErrors.addressDetail ? 'border-red-500' : ''}`} />
                {fieldErrors.addressDetail && <p className="text-red-500 text-[10px]">{fieldErrors.addressDetail}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel glow-hover space-y-2 rounded-[20px] p-4 sm:p-6 text-white shadow-xl">
          <Label htmlFor="booking-desired-time" className="font-semibold">Thời gian mong muốn *</Label>
          <Input id="booking-desired-time" name="desiredTime" autoComplete="off" type="datetime-local" value={desiredTime} onChange={(e) => {
            setDesiredTime(e.target.value);
            validate('desiredTime', e.target.value);
          }}
            min={new Date().toISOString().slice(0, 16)} className={fieldErrors.desiredTime ? 'border-red-500' : 'border-white/10 bg-white/5'} />
          {fieldErrors.desiredTime && <p className="text-red-500 text-[10px]">{fieldErrors.desiredTime}</p>}

          {/* AI Scheduling Hints */}
          <div className="mt-4 p-4 rounded-[20px] bg-white/5 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-5 rotate-12 transition-transform group-hover:scale-110">
              <Sparkles className="w-12 h-12 text-sky-400" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Gợi ý lịch hẹn</span>
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
                className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-500/10 text-green-400 rounded-lg shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Sáng mai, 09:00</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">Khung giờ vàng - Thợ đang trống lịch gần đây</p>
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
                className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Hôm nay, trong 2 giờ tới</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">Phản hồi siêu tốc - Ưu tiên nhận đơn</p>
                  </div>
                </div>
                <Badge className="bg-sky-500 text-white border-0 text-[9px] sm:text-[10px] font-bold uppercase self-start sm:self-auto">Ưu tiên</Badge>
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
