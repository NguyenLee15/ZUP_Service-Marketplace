'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Check, Clock, AlertCircle } from 'lucide-react';

const kycSchema = z.object({
  fullName: z.string().min(5, 'Họ tên phải có ít nhất 5 ký tự'),
  idNumber: z.string().regex(/^\d{9,12}$/, 'CCCD phải từ 9-12 số'),
  dateOfBirth: z.string().nonempty('Vui lòng chọn ngày sinh'),
  address: z.string().min(10, 'Địa chỉ phải có ít nhất 10 ký tự'),
  issueDate: z.string().nonempty('Vui lòng chọn ngày cấp'),
  issueLocation: z.string().min(5, 'Nơi cấp phải có ít nhất 5 ký tự'),
});

type KYCFormData = z.infer<typeof kycSchema>;

export default function ProviderKYC() {
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved' | 'rejected'>('pending'); // Mock status
  const [uploadedFiles, setUploadedFiles] = useState({
    cccdFront: false,
    cccdBack: false,
    portrait: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: 'Nguyễn Văn A',
      idNumber: '123456789',
      dateOfBirth: '1990-01-15',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      issueDate: '2020-01-15',
      issueLocation: 'Công an TP.HCM',
    },
  });

  const handleFileUpload = (fileType: keyof typeof uploadedFiles) => {
    setUploadedFiles(prev => ({ ...prev, [fileType]: true }));
  };

  const onSubmit = async (data: KYCFormData) => {
    if (!uploadedFiles.cccdFront || !uploadedFiles.cccdBack || !uploadedFiles.portrait) {
      alert('Vui lòng tải lên tất cả các tài liệu cần thiết');
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    alert('Thông tin KYC đã được gửi. Đang chờ xác thực...');
  };

  const isFormDisabled = kycStatus === 'approved';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Xác Thực KYC</h1>
        <p className="text-gray-500 mt-1">Hoàn thành quá trình xác minh danh tính</p>
      </div>

      {/* Status Alert */}
      {kycStatus === 'approved' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 flex items-start gap-4">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-700">Đã Xác Thực Thành Công</h3>
              <p className="text-sm text-green-600 mt-1">Tài khoản của bạn đã được xác minh. Bạn có thể sử dụng tất cả các tính năng.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {kycStatus === 'pending' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6 flex items-start gap-4">
            <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-700">Đang Chờ Xác Thực</h3>
              <p className="text-sm text-yellow-600 mt-1">Hồ sơ KYC của bạn đang được kiểm tra. Vui lòng đợi 1-3 ngày làm việc.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {kycStatus === 'rejected' && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-700">Xác Thực Thất Bại</h3>
              <p className="text-sm text-red-600 mt-1">Hồ sơ của bạn không đạt yêu cầu. Vui lòng kiểm tra lại thông tin và cập nhật.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thông Tin Cá Nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ và Tên</label>
              <Input
                placeholder="Nhập họ và tên"
                {...register('fullName')}
                disabled={isFormDisabled}
              />
              {errors.fullName && (
                <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày Sinh</label>
                <Input
                  type="date"
                  {...register('dateOfBirth')}
                  disabled={isFormDisabled}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số CCCD</label>
                <Input
                  placeholder="Nhập số CCCD"
                  {...register('idNumber')}
                  disabled={isFormDisabled}
                />
                {errors.idNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.idNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Địa Chỉ</label>
              <Input
                placeholder="Nhập địa chỉ"
                {...register('address')}
                disabled={isFormDisabled}
              />
              {errors.address && (
                <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ID Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thông Tin CCCD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày Cấp</label>
                <Input
                  type="date"
                  {...register('issueDate')}
                  disabled={isFormDisabled}
                />
                {errors.issueDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.issueDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nơi Cấp</label>
                <Input
                  placeholder="Nhập nơi cấp"
                  {...register('issueLocation')}
                  disabled={isFormDisabled}
                />
                {errors.issueLocation && (
                  <p className="text-sm text-red-600 mt-1">{errors.issueLocation.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tải Lên Tài Liệu</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Ảnh phải rõ ràng, định dạng JPG/PNG, tối đa 5MB</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CCCD Front */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CCCD Mặt Trước</label>
              <div
                onClick={() => !isFormDisabled && handleFileUpload('cccdFront')}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  uploadedFiles.cccdFront
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400'
                } ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadedFiles.cccdFront ? (
                  <div className="text-green-600">
                    <Check className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Đã tải lên</p>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Kéo thả hoặc nhấp để chọn</p>
                  </div>
                )}
              </div>
            </div>

            {/* CCCD Back */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CCCD Mặt Sau</label>
              <div
                onClick={() => !isFormDisabled && handleFileUpload('cccdBack')}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  uploadedFiles.cccdBack
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400'
                } ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadedFiles.cccdBack ? (
                  <div className="text-green-600">
                    <Check className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Đã tải lên</p>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Kéo thả hoặc nhấp để chọn</p>
                  </div>
                )}
              </div>
            </div>

            {/* Portrait */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh Chân Dung</label>
              <div
                onClick={() => !isFormDisabled && handleFileUpload('portrait')}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  uploadedFiles.portrait
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400'
                } ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadedFiles.portrait ? (
                  <div className="text-green-600">
                    <Check className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Đã tải lên</p>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Kéo thả hoặc nhấp để chọn</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        {!isFormDisabled && (
          <div className="flex gap-3 justify-end">
            <Button variant="outline">Hủy</Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi Để Xác Thực'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
