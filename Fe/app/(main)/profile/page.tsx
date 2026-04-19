'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Upload, Camera, Check, AlertCircle } from 'lucide-react'

// Validation schemas
const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^[0-9]{10,11}$/, 'SĐT phải có 10-11 chữ số'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Mật khẩu cũ phải có ít nhất 6 ký tự'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=customer123')
  const [uploading, setUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      phone: '0912345678',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    // Simulate upload
    setTimeout(() => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatar(event.target?.result as string)
        setSuccessMessage('Cập nhật ảnh đại diện thành công!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
      reader.readAsDataURL(file)
      setUploading(false)
    }, 1000)
  }

  const onProfileSubmit = async (data: ProfileFormData) => {
    console.log('Profile updated:', data)
    setSuccessMessage('Cập nhật hồ sơ thành công!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    console.log('Password changed:', data)
    setSuccessMessage('Đổi mật khẩu thành công!')
    passwordForm.reset()
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hồ Sơ Cá Nhân</h1>
        <p className="text-gray-600 mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Avatar Upload Section */}
      <Card className="p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ảnh Đại Diện</h2>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={avatar}
              alt="User Avatar"
              className="w-32 h-32 rounded-full border-4 border-gray-200 object-cover"
            />
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 cursor-pointer transition"
            >
              <Camera className="w-5 h-5" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-3">Tải lên ảnh đại diện mới</p>
            <label htmlFor="avatar-upload" className="inline-block">
              <Button
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                type="button"
                asChild
              >
                <span className="cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Đang tải...' : 'Chọn Ảnh'}
                </span>
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF. Tối đa 5MB</p>
          </div>
        </div>
      </Card>

      {/* Profile Information Section */}
      <Card className="p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Thông Tin Cá Nhân</h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Họ Tên</label>
            <Input
              placeholder="Nhập họ tên"
              {...profileForm.register('fullName')}
              className="w-full"
            />
            {profileForm.formState.errors.fullName && (
              <p className="text-red-600 text-sm mt-1">{profileForm.formState.errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input
              placeholder="email@example.com"
              type="email"
              disabled
              {...profileForm.register('email')}
              className="w-full bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số Điện Thoại</label>
            <Input
              placeholder="09xxxxxxxx"
              {...profileForm.register('phone')}
              className="w-full"
            />
            {profileForm.formState.errors.phone && (
              <p className="text-red-600 text-sm mt-1">{profileForm.formState.errors.phone.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
          >
            {profileForm.formState.isSubmitting ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
          </Button>
        </form>
      </Card>

      {/* Password Change Section */}
      <Card className="p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Đổi Mật Khẩu</h2>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mật Khẩu Cũ</label>
            <Input
              placeholder="Nhập mật khẩu cũ"
              type="password"
              {...passwordForm.register('currentPassword')}
              className="w-full"
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-red-600 text-sm mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mật Khẩu Mới</label>
            <Input
              placeholder="Nhập mật khẩu mới"
              type="password"
              {...passwordForm.register('newPassword')}
              className="w-full"
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-red-600 text-sm mt-1">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Xác Nhận Mật Khẩu Mới</label>
            <Input
              placeholder="Nhập lại mật khẩu mới"
              type="password"
              {...passwordForm.register('confirmPassword')}
              className="w-full"
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
          >
            {passwordForm.formState.isSubmitting ? 'Đang Lưu...' : 'Đổi Mật Khẩu'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
