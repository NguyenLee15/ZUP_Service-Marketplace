'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, Percent, BadgeDollarSign, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [currentCommission, setCurrentCommission] = useState({
    rate: 8.5,
    minAmount: 50000,
    maxAmount: 5000000,
  });

  // Edit fields
  const [editRate, setEditRate] = useState('');
  const [editMin, setEditMin] = useState('');
  const [editMax, setEditMax] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (name: string, value: string) => {
    const newErrors = { ...fieldErrors };
    const val = parseFloat(value);
    if (name === 'rate') {
      if (isNaN(val) || val < 0 || val > 100) newErrors.rate = 'Tỉ lệ phải từ 0-100';
      else delete newErrors.rate;
    }
    if (name === 'minAmount') {
      if (isNaN(val) || val < 0) newErrors.minAmount = 'Không hợp lệ';
      else delete newErrors.minAmount;
    }
    if (name === 'maxAmount') {
      if (isNaN(val) || val < 0) newErrors.maxAmount = 'Không hợp lệ';
      else if (val < (parseInt(editMin) || 0)) newErrors.maxAmount = 'Phải lớn hơn mức tối thiểu';
      else delete newErrors.maxAmount;
    }
    setFieldErrors(newErrors);
  };

  useEffect(() => {
    adminApi.getCommission()
      .then((res) => {
        const data = res.data.data;
        setCurrentCommission({
          rate: data.rate || 8.5,
          minAmount: data.minAmount || 50000,
          maxAmount: data.maxAmount || 5000000,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: 'Tỉ lệ hoa hồng phải từ 0 đến 100%', variant: 'destructive' });
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
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="flex flex-col gap-1 border-b border-[var(--admin-border)] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Cài đặt hệ thống</h1>
        <p className="text-sm text-slate-500">Quản lý cấu hình vận hành, hoa hồng và trạng thái module.</p>
      </div>

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
                <Button onClick={startEditing} className="gap-2 rounded-md bg-slate-950 hover:bg-slate-800">
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
  );
}
