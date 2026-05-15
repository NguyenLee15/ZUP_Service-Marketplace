'use client';

import React, { useState, useEffect } from 'react';
import { Save, History, TrendingDown, Loader2 } from 'lucide-react';
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
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || err.message, variant: 'destructive' });
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
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Cài Đặt Hệ Thống</h3>
        <p className="text-muted-foreground mt-1">Quản lý cấu hình chính và tỉ lệ hoa hồng</p>
      </div>

      {/* Commission Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cài Đặt Hoa Hồng</CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              {/* Current Settings Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-2">Tỉ Lệ Hoa Hồng</p>
                  <p className="text-3xl font-bold text-blue-900">{currentCommission.rate}%</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-2">Hoa Hồng Tối Thiểu</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatVND(currentCommission.minAmount)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium mb-2">Hoa Hồng Tối Đa</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatVND(currentCommission.maxAmount)}
                  </p>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="bg-muted p-4 rounded-lg border border-border">
                <h4 className="font-medium text-foreground mb-3">Ví Dụ Tính Toán</h4>
                <div className="space-y-2 text-sm">
                  {[1000000, 10000000, 50000000].map((amount) => (
                    <div key={amount} className="flex justify-between text-gray-700">
                      <span>Đơn hàng {amount.toLocaleString('vi-VN')} VNĐ:</span>
                      <span className="font-medium">
                        {formatVND(amount * (currentCommission.rate / 100))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button onClick={startEditing} className="gap-2">
                  Chỉnh Sửa Cài Đặt
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  Thay đổi này sẽ có hiệu lực ngay lập tức cho tất cả các đơn hàng mới.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={saving || Object.keys(fieldErrors).length > 0} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu Cài Đặt
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cài Đặt Khác</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">Bảo Trì Hệ Thống</p>
              <p className="text-sm text-muted-foreground">Tắt hệ thống tạm thời</p>
            </div>
            <Button variant="outline" size="sm">Cấu Hình</Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">Thông Báo Email</p>
              <p className="text-sm text-muted-foreground">Quản lý cài đặt email</p>
            </div>
            <Button variant="outline" size="sm">Cấu Hình</Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">Bảo Mật</p>
              <p className="text-sm text-muted-foreground">Cài đặt bảo mật và quyền hạn</p>
            </div>
            <Button variant="outline" size="sm">Cấu Hình</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
