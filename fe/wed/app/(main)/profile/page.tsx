'use client'

import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Camera, Check, AlertCircle, MapPin, Lock, UserIcon } from 'lucide-react'
import { authApi } from '@/features/auth/services/auth.api'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import Image from 'next/image'

// Validation schemas
const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
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
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [avatar, setAvatar] = useState('')
  const [uploading, setUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const isLocalAvatarPreview = avatar.startsWith('blob:')

  // Load profile from API
  useEffect(() => {
    authApi.getProfile()
      .then((res) => {
        const u = res.data.data
        setUser(u)
        setAvatar(u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`)
        profileForm.reset({ fullName: u.fullName || '', phone: u.phone || '' })
      })
      .catch((err: any) => {
        if (err?.response?.status === 401) {
          useAuthStore.getState().logout()
          router.push('/login')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setErrorMessage('')
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const showError = (msg: string) => {
    setErrorMessage(msg)
    setSuccessMessage('')
    setTimeout(() => setErrorMessage(''), 4000)
  }

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const formData = new FormData()
      formData.append('fullName', data.fullName)
      formData.append('phone', data.phone)

      const res = await (await import('@/lib/axios')).default.patch('/users/profile', formData)
      setUser(res.data.data)
      showSuccess('Cập nhật hồ sơ thành công')
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.')
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      showSuccess('Đổi mật khẩu thành công')
      passwordForm.reset()
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Mật khẩu cũ không đúng. Vui lòng kiểm tra lại.')
    }
  }

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await (await import('@/lib/axios')).default.patch('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAvatar(res.data.data.avatarUrl || URL.createObjectURL(file))
      setUser(res.data.data)
      showSuccess('Cập nhật ảnh đại diện thành công')
    } catch {
      showError('Không thể tải ảnh lên. Vui lòng chọn ảnh khác hoặc thử lại sau.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded-xl animate-pulse" />
        <div className="h-60 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <main className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground text-pretty">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin tài khoản của bạn</p>
        </div>
        <Link href="/profile/addresses">
          <Button variant="outline" className="gap-2">
            <MapPin className="w-4 h-4" /> Quản lý địa chỉ
          </Button>
        </Link>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800" aria-live="polite">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800" aria-live="polite">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Avatar Upload Section */}
      <Card className="p-6 border border-border shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-action-blue" /> Ảnh đại diện
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            {avatar ? (
              <Image 
                src={avatar} 
                alt={`Ảnh đại diện của ${user?.fullName || user?.email || 'người dùng'}`}
                width={128} 
                height={128} 
                priority 
                unoptimized={isLocalAvatarPreview}
                className="w-32 h-32 rounded-full border-4 border-border object-cover shadow-xl" 
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-border bg-muted flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <label
              htmlFor="avatar-upload"
              aria-label="Tải ảnh đại diện mới"
              className="absolute bottom-0 right-0 bg-action-blue text-white p-2 rounded-full hover:bg-glacier-blue cursor-pointer transition-colors shadow-lg focus-within:ring-2 focus-within:ring-action-blue focus-within:ring-offset-2"
            >
              <Camera className="w-5 h-5" />
              <input id="avatar-upload" name="avatar" type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="sr-only" />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Email: <span className="font-medium text-foreground">{user?.email}</span></p>
            <p className="text-sm text-muted-foreground">Vai trò: <span className="font-medium text-foreground">{user?.role === 'CUSTOMER' ? 'Khách hàng' : user?.role === 'PROVIDER' ? 'Nhà cung cấp' : user?.role}</span></p>
            <p className="text-xs text-muted-foreground mt-2">Hỗ trợ JPG, PNG, GIF. Tối đa 5&nbsp;MB.</p>
            {uploading && <p className="text-xs text-action-blue mt-2" aria-live="polite">Đang tải ảnh lên…</p>}
          </div>
        </div>
      </Card>

      {/* Profile Information Section */}
      <Card className="p-6 border border-border shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-action-blue" /> Thông tin cá nhân
        </h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label htmlFor="profile-full-name" className="block text-sm font-medium text-foreground/80 mb-2">Họ tên</label>
            <Input
              id="profile-full-name"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              {...profileForm.register('fullName')}
              className="w-full"
            />
            {profileForm.formState.errors.fullName && (
              <p className="text-red-600 text-sm mt-1">{profileForm.formState.errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-foreground/80 mb-2">Số điện thoại</label>
            <Input
              id="profile-phone"
              type="tel"
              inputMode="numeric"
              placeholder="09xxxxxxxx"
              autoComplete="tel"
              {...profileForm.register('phone')}
              className="w-full"
            />
            {profileForm.formState.errors.phone && (
              <p className="text-red-600 text-sm mt-1">{profileForm.formState.errors.phone.message}</p>
            )}
          </div>

          <Button type="submit" disabled={profileForm.formState.isSubmitting} className="bg-action-blue hover:bg-glacier-blue text-white w-full md:w-auto shadow-[var(--brand-shadow-button)]">
            {profileForm.formState.isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </form>
      </Card>

      {/* Password Change Section */}
      <Card className="p-6 border border-border shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-action-blue" /> Đổi mật khẩu
        </h2>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-foreground/80 mb-2">Mật khẩu cũ</label>
            <Input
              id="current-password"
              placeholder="Nhập mật khẩu cũ"
              type="password"
              autoComplete="current-password"
              {...passwordForm.register('currentPassword')}
              className="w-full"
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-red-600 text-sm mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-foreground/80 mb-2">Mật khẩu mới</label>
            <Input
              id="new-password"
              placeholder="Nhập mật khẩu mới"
              type="password"
              autoComplete="new-password"
              {...passwordForm.register('newPassword')}
              className="w-full"
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-red-600 text-sm mt-1">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground/80 mb-2">Xác nhận mật khẩu mới</label>
            <Input
              id="confirm-password"
              placeholder="Nhập lại mật khẩu mới"
              type="password"
              autoComplete="new-password"
              {...passwordForm.register('confirmPassword')}
              className="w-full"
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" disabled={passwordForm.formState.isSubmitting} className="bg-action-blue hover:bg-glacier-blue text-white w-full md:w-auto shadow-[var(--brand-shadow-button)]">
            {passwordForm.formState.isSubmitting ? 'Đang lưu…' : 'Đổi mật khẩu'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
