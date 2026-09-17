'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, Percent, BadgeDollarSign, Landmark, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import { AdminPermissionGuard, useAdminPermission } from '@/features/admin/components/AdminPermissionGuard';
import { AdminPermission } from '@/types/admin-permissions';

export default function SettingsPage() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermission();
  const canEditCommission = hasPermission(AdminPermission.FINANCE_COMMISSION);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [currentCommission, setCurrentCommission] = useState({
    rate: 10,
    minAmount: 10000,
    maxAmount: 500000,
  });

  // Edit fields
  const [editRate, setEditRate] = useState('');
  const [editMin, setEditMin] = useState('');
  const [editMax, setEditMax] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (name: string, value: string) => {
    const nextRate = name === 'rate' ? parseFloat(value) : parseFloat(editRate);
    const nextMin = name === 'minAmount' ? parseInt(value, 10) : parseInt(editMin, 10);
    const nextMax = name === 'maxAmount' ? parseInt(value, 10) : parseInt(editMax, 10);
    const newErrors: Record<string, string> = {};
    if (!Number.isFinite(nextRate) || nextRate < 0 || nextRate > 100) {
      newErrors.rate = 'Tỉ lệ phải từ 0 đến 100';
    }
    if (!Number.isFinite(nextMin) || nextMin < 0) {
      newErrors.minAmount = 'Mức tối thiểu không hợp lệ';
    }
    if (!Number.isFinite(nextMax) || nextMax < 0) {
      newErrors.maxAmount = 'Mức tối đa không hợp lệ';
    } else if (Number.isFinite(nextMin) && nextMin > nextMax) {
      newErrors.minAmount = 'Không được lớn hơn mức tối đa';
      newErrors.maxAmount = 'Phải lớn hơn hoặc bằng mức tối thiểu';
    }
    setFieldErrors(newErrors);
  };

  const loadCommission = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    adminApi.getCommission()
      .then((res) => {
        const data = res.data?.data || {};
        setCurrentCommission({
          rate: data.rate || 8.5,
          minAmount: data.minAmount || 50000,
          maxAmount: data.maxAmount || 5000000,
        });
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không thể tải cấu hình hoa hồng. Vui lòng kiểm tra kết nối và thử lại.';
        setLoadError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCommission();
  }, [loadCommission]);

  const startEditing = () => {
    setEditRate(String(currentCommission.rate));
    setEditMin(String(currentCommission.minAmount));
    setEditMax(String(currentCommission.maxAmount));
    setIsEditing(true);
  };

  const handleSave = async () => {
    const rate = parseFloat(editRate);
    const minAmount = parseInt(editMin);
    const maxAmount = parseInt(editMax);

    if (!Number.isFinite(rate) || rate < 0 || rate > 100 || !Number.isFinite(minAmount) || !Number.isFinite(maxAmount) || minAmount < 0 || maxAmount < 0 || minAmount > maxAmount) {
      toast({ title: 'Vui lòng kiểm tra tỉ lệ và khoảng mức hoa hồng', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateCommission({ rate, minAmount, maxAmount });
      setCurrentCommission({ rate, minAmount, maxAmount });
      setIsEditing(false);
      toast({ title: 'Đã cập nhật cấu hình hoa hồng' });
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null
          ? (
              err as {
                response?: { data?: { message?: string } };
                message?: string;
              }
            ).response?.data?.message ||
            (err as { message?: string }).message
          : undefined;

      toast({ title: 'Lỗi', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formatVND = (n: number) => n.toLocaleString('vi-VN') + ' VNĐ';

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminPermissionGuard permission={[AdminPermission.FINANCE_COMMISSION, AdminPermission.SETTINGS_MANAGE]}>
      <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="flex flex-col gap-1 border-b border-[var(--admin-border)] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Cài đặt hệ thống</h1>
        <p className="text-sm text-slate-500">Quản lý cấu hình vận hành, hoa hồng và trạng thái module.</p>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCommission}
            className="border-red-300 text-red-800 hover:bg-red-100 shrink-0"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Commission Settings */}
      <Card className="overflow-hidden rounded-lg border-[var(--admin-border)] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--admin-border)] bg-white px-4 py-3">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-950">Cài đặt hoa hồng</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Áp dụng cho đơn hàng mới sau khi lưu.</p>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {!isEditing ? (
            <div className="space-y-4">
              {/* Current Settings Display */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
                    <Percent className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Tỉ lệ hoa hồng</p>
                  <p className="admin-kpi-number mt-1 text-3xl font-bold text-slate-950">{currentCommission.rate}%</p>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                    <BadgeDollarSign className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-700/80">Hoa hồng tối thiểu</p>
                  <p className="admin-kpi-number mt-1 text-2xl font-bold text-emerald-900">
                    {formatVND(currentCommission.minAmount)}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-amber-700/80">Hoa hồng tối đa</p>
                  <p className="admin-kpi-number mt-1 text-2xl font-bold text-amber-900">
                    {formatVND(currentCommission.maxAmount)}
                  </p>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="rounded-lg border border-[var(--admin-border)] bg-slate-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-950">Ví dụ tính toán</h4>
                <div className="space-y-2 text-sm">
                  {[1000000, 10000000, 50000000].map((amount) => (
                    <div key={amount} className="flex justify-between gap-4 text-slate-600">
                      <span>Đơn hàng {amount.toLocaleString('vi-VN')} VNĐ:</span>
                      <span className="font-mono font-semibold text-slate-950">
                        {formatVND(amount * (currentCommission.rate / 100))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t border-[var(--admin-border)] pt-4">
                <Button
                  onClick={startEditing}
                  disabled={!canEditCommission}
                  title={!canEditCommission ? 'Bạn không có quyền chỉnh sửa cài đặt hoa hồng' : undefined}
                  className="gap-2 rounded-md bg-slate-950 hover:bg-slate-800 disabled:opacity-50"
                >
                  Chỉnh sửa cài đặt
                </Button>
              </div>
            </div>
          ) : (
            /* Edit Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Tỉ Lệ Hoa Hồng (%)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={editRate}
                    onChange={(e) => {
                      setEditRate(e.target.value);
                      validate('rate', e.target.value);
                    }}
                    className={`flex-1 ${fieldErrors.rate ? 'border-red-500' : ''}`}
                  />
                  <span className="text-foreground/80 font-medium">%</span>
                </div>
                {fieldErrors.rate && <p className="text-red-500 text-xs mt-1">{fieldErrors.rate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Hoa Hồng Tối Thiểu (VNĐ)
                </label>
                <Input
                  type="number"
                  value={editMin}
                  onChange={(e) => {
                    setEditMin(e.target.value);
                    validate('minAmount', e.target.value);
                  }}
                  className={fieldErrors.minAmount ? 'border-red-500' : ''}
                />
                {fieldErrors.minAmount && <p className="text-red-500 text-xs mt-1">{fieldErrors.minAmount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Hoa Hồng Tối Đa (VNĐ)
                </label>
                <Input
                  type="number"
                  value={editMax}
                  onChange={(e) => {
                    setEditMax(e.target.value);
                    validate('maxAmount', e.target.value);
                  }}
                  className={fieldErrors.maxAmount ? 'border-red-500' : ''}
                />
                {fieldErrors.maxAmount && <p className="text-red-500 text-xs mt-1">{fieldErrors.maxAmount}</p>}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-700">
                  Thay đổi này sẽ có hiệu lực ngay lập tức cho tất cả các đơn hàng mới.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={saving || Object.keys(fieldErrors).length > 0} className="gap-2 rounded-md bg-slate-950 hover:bg-slate-800">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu Cài Đặt
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      </div>
    </AdminPermissionGuard>
  );
}
