'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

const serviceSchema = z.object({
  name: z.string().min(10, 'Tên dịch vụ phải có ít nhất 10 ký tự'),
  category: z.string().nonempty('Vui lòng chọn danh mục'),
  price: z.string().nonempty('Giá không được để trống'),
  description: z.string().min(20, 'Mô tả phải có ít nhất 20 ký tự'),
  duration: z.string().nonempty('Thời gian không được để trống'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function ServiceEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    mode: 'onChange',
    defaultValues: {
      name: 'Thiết Kế Logo Chuyên Nghiệp',
      category: 'Thiết Kế Đồ Họa',
      price: '500.000',
      description: 'Thiết kế logo độc đáo, sáng tạo theo yêu cầu. Đội ngũ designer có kinh nghiệm 10+ năm',
      duration: '3-5 ngày',
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Dịch vụ đã được cập nhật thành công!');
    router.push('/provider/services');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link href="/provider/services">
        <Button variant="ghost" className="flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Quay Lại
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Chỉnh Sửa Dịch Vụ</h1>
        <p className="text-gray-500 mt-1">ID Dịch Vụ: {params.id}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tên Dịch Vụ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tên Dịch Vụ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Nhập tên dịch vụ"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Danh Mục */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh Mục</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn danh mục</option>
                <option value="Thiết Kế Đồ Họa">Thiết Kế Đồ Họa</option>
                <option value="Lập Trình">Lập Trình</option>
                <option value="Video Editing">Video Editing</option>
                <option value="Tư Vấn">Tư Vấn</option>
              </select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Giá */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Giá (VNĐ)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="500.000"
                {...register('price')}
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Thời Gian */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thời Gian Hoàn Thành</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="3-5 ngày"
                {...register('duration')}
              />
              {errors.duration && (
                <p className="text-sm text-red-600">{errors.duration.message}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mô Tả */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mô Tả Dịch Vụ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <textarea
              placeholder="Mô tả chi tiết về dịch vụ của bạn..."
              rows={6}
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Upload Ảnh */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ảnh Dịch Vụ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">Kéo thả ảnh hoặc nhấp để chọn</p>
              <Input
                type="file"
                accept="image/*"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">Tối đa 5 ảnh, dung lượng mỗi ảnh tối đa 5MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <Link href="/provider/services">
            <Button variant="outline">Hủy</Button>
          </Link>
          <Button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </Button>
        </div>
      </form>
    </div>
  );
}
