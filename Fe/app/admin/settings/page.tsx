'use client';

import React, { useState } from 'react';
import { Save, History, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const settingsSchema = z.object({
  commissionRate: z.coerce
    .number()
    .min(0, 'Tỉ lệ phải lớn hơn 0')
    .max(100, 'Tỉ lệ không được vượt quá 100'),
  minCommission: z.coerce
    .number()
    .min(0, 'Hoa hồng tối thiểu phải lớn hơn 0'),
  maxCommission: z.coerce
    .number()
    .min(0, 'Hoa hồng tối đa phải lớn hơn 0'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface CommissionHistory {
  id: string;
  rate: number;
  minAmount: number;
  maxAmount: number;
  changedBy: string;
  changedAt: string;
  effectiveDate: string;
  notes?: string;
}

const mockCommissionHistory: CommissionHistory[] = [
  {
    id: 'CH001',
    rate: 8.5,
    minAmount: 50000,
    maxAmount: 5000000,
    changedBy: 'Admin User',
    changedAt: '2024-04-01 10:30',
    effectiveDate: '2024-04-01',
    notes: 'Điều chỉnh theo chính sách mới',
  },
  {
    id: 'CH002',
    rate: 8.0,
    minAmount: 50000,
    maxAmount: 3000000,
    changedBy: 'Admin User',
    changedAt: '2024-03-15 14:45',
    effectiveDate: '2024-03-15',
    notes: 'Giảm tỉ lệ hoa hồng để tăng cạnh tranh',
  },
  {
    id: 'CH003',
    rate: 10.0,
    minAmount: 100000,
    maxAmount: 5000000,
    changedBy: 'Admin User',
    changedAt: '2024-02-01 09:00',
    effectiveDate: '2024-02-01',
  },
];

export default function SettingsPage() {
  const [currentCommission, setCurrentCommission] = useState({
    rate: 8.5,
    minAmount: 50000,
    maxAmount: 5000000,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    mode: 'onChange',
    defaultValues: {
      commissionRate: currentCommission.rate,
      minCommission: currentCommission.minAmount,
      maxCommission: currentCommission.maxAmount,
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    console.log('Saving settings:', data);
    setCurrentCommission({
      rate: data.commissionRate,
      minAmount: data.minCommission,
      maxAmount: data.maxCommission,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Cài Đặt Hệ Thống</h3>
        <p className="text-gray-600 mt-1">Quản lý cấu hình chính và tỉ lệ hoa hồng</p>
      </div>

      {/* Commission Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cài Đặt Hoa Hồng</CardTitle>
          {saveSuccess && (
            <span className="text-sm text-green-600 font-medium">Lưu thành công</span>
          )}
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              {/* Current Settings Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-2">Tỉ Lệ Hoa Hồng</p>
                  <p className="text-3xl font-bold text-blue-900">{currentCommission.rate}%</p>
                  <p className="text-xs text-blue-700 mt-2">Áp dụng từ 2024-04-01</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-2">Hoa Hồng Tối Thiểu</p>
                  <p className="text-2xl font-bold text-green-900">
                    {currentCommission.minAmount.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium mb-2">Hoa Hồng Tối Đa</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {currentCommission.maxAmount.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Ví Dụ Tính Toán</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Đơn hàng 1,000,000 VNĐ:</span>
                    <span className="font-medium">
                      {(1000000 * (currentCommission.rate / 100)).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Đơn hàng 10,000,000 VNĐ:</span>
                    <span className="font-medium">
                      {(10000000 * (currentCommission.rate / 100)).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Đơn hàng 50,000,000 VNĐ:</span>
                    <span className="font-medium">
                      {(50000000 * (currentCommission.rate / 100)).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowHistory(!showHistory)}
                  className="gap-2"
                >
                  <History className="w-4 h-4" />
                  Lịch Sử Thay Đổi
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(true);
                    reset({
                      commissionRate: currentCommission.rate,
                      minCommission: currentCommission.minAmount,
                      maxCommission: currentCommission.maxAmount,
                    });
                  }}
                  className="gap-2"
                >
                  Chỉnh Sửa Cài Đặt
                </Button>
              </div>
            </div>
          ) : (
            /* Edit Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỉ Lệ Hoa Hồng (%)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="8.5"
                    {...register('commissionRate')}
                    className={`flex-1 ${errors.commissionRate ? 'border-red-500' : ''}`}
                  />
                  <span className="text-gray-700 font-medium">%</span>
                </div>
                {errors.commissionRate && (
                  <p className="text-red-600 text-sm mt-1">{errors.commissionRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hoa Hồng Tối Thiểu (VNĐ)
                </label>
                <Input
                  type="number"
                  placeholder="50000"
                  {...register('minCommission')}
                  className={errors.minCommission ? 'border-red-500' : ''}
                />
                {errors.minCommission && (
                  <p className="text-red-600 text-sm mt-1">{errors.minCommission.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hoa Hồng Tối Đa (VNĐ)
                </label>
                <Input
                  type="number"
                  placeholder="5000000"
                  {...register('maxCommission')}
                  className={errors.maxCommission ? 'border-red-500' : ''}
                />
                {errors.maxCommission && (
                  <p className="text-red-600 text-sm mt-1">{errors.maxCommission.message}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  Thay đổi này sẽ có hiệu lực ngay lập tức cho tất cả các đơn hàng mới.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" className="gap-2">
                  <Save className="w-4 h-4" />
                  Lưu Cài Đặt
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Commission History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Lịch Sử Thay Đổi Hoa Hồng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCommissionHistory.map((history) => (
                <div
                  key={history.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Tỉ Lệ: {history.rate}%
                        </p>
                        <p className="text-xs text-gray-600">
                          {history.changedAt} bởi {history.changedBy}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {history.effectiveDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Tối Thiểu</p>
                      <p className="font-medium">
                        {history.minAmount.toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tối Đa</p>
                      <p className="font-medium">
                        {history.maxAmount.toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>
                  </div>

                  {history.notes && (
                    <p className="text-sm text-gray-700 mt-3 bg-gray-50 p-2 rounded">
                      {history.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cài Đặt Khác</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Bảo Trì Hệ Thống</p>
              <p className="text-sm text-gray-600">Tắt hệ thống tạm thời</p>
            </div>
            <Button variant="outline" size="sm">
              Cấu Hình
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Thông Báo Email</p>
              <p className="text-sm text-gray-600">Quản lý cài đặt email</p>
            </div>
            <Button variant="outline" size="sm">
              Cấu Hình
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Bảo Mật</p>
              <p className="text-sm text-gray-600">Cài đặt bảo mật và quyền hạn</p>
            </div>
            <Button variant="outline" size="sm">
              Cấu Hình
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
