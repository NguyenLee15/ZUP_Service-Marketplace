'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z
      .string()
      .regex(/^0[0-9]{9}$/, 'Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(6, 'Xác nhận mật khẩu không được để trống'),
    role: z.enum(['customer', 'provider'], { errorMap: () => ({ message: 'Vui lòng chọn vai trò' }) }),
    otpCode: z.string().regex(/^[0-9]{6}$/, 'Mã OTP phải là 6 chữ số'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

const OTPInput = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const handleChange = (index: number, char: string) => {
    // Only allow digits
    if (!/^\d?$/.test(char)) return

    const newValue = value.split('')
    newValue[index] = char
    const result = newValue.join('')

    // Auto-move to next field if digit entered
    if (char && index < 5) {
      const nextInput = document.querySelector(`[data-otp-index="${index + 1}"]`) as HTMLInputElement
      nextInput?.focus()
    }

    onChange(result)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      const prevInput = document.querySelector(`[data-otp-index="${index - 1}"]`) as HTMLInputElement
      prevInput?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          inputMode="numeric"
          data-otp-index={index}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          placeholder="0"
        />
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [isLoadingForm, setIsLoadingForm] = useState(false)
  const [isLoadingOTP, setIsLoadingOTP] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const password = watch('password')
  const otpCode = watch('otpCode')

  const onSubmitForm = async (data: RegisterFormData) => {
    setIsLoadingForm(true)
    try {
      console.log('Register initial data:', {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: data.role,
      })
      // Simulate OTP sending
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setOtpSent(true)
      setCountdown(60)
      setStep('otp')
    } catch (error) {
      console.error('Register error:', error)
    } finally {
      setIsLoadingForm(false)
    }
  }

  const onSubmitOTP = async (data: RegisterFormData) => {
    setIsLoadingOTP(true)
    try {
      console.log('Registration complete:', data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      alert(`Đăng ký thành công! Chào mừng ${data.fullName}`)
      // Reset form and go back to login
      setStep('form')
      setOtpSent(false)
    } catch (error) {
      console.error('OTP verification error:', error)
    } finally {
      setIsLoadingOTP(false)
    }
  }

  const handleResendOTP = () => {
    if (countdown === 0) {
      setCountdown(60)
      setOtpSent(true)
      console.log('OTP resent')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white">
              <UserPlus size={24} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng Ký</h1>
          <p className="text-gray-600 text-sm">Tạo tài khoản trên Marketplace Dịch Vụ</p>
        </div>

        {/* Step 1: Register Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit(onSubmitForm)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-700 font-medium">
                Họ và Tên
              </Label>
              <Input
                id="fullName"
                placeholder="Nguyễn Văn A"
                {...register('fullName')}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                {...register('email')}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Số Điện Thoại
              </Label>
              <Input
                id="phone"
                placeholder="0912345678"
                {...register('phone')}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Mật khẩu
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                Xác Nhận Mật Khẩu
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
            </div>

            {/* Role Selection */}
            <div className="space-y-2 pt-2">
              <Label className="text-gray-700 font-medium">Vai trò của bạn</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <RadioGroup value={field.value} onValueChange={field.onChange}>
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="cursor-pointer flex-1 m-0">
                        <span className="font-medium text-gray-900">Khách hàng</span>
                        <p className="text-xs text-gray-500 mt-1">Tìm kiếm dịch vụ</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="provider" id="provider" />
                      <Label htmlFor="provider" className="cursor-pointer flex-1 m-0">
                        <span className="font-medium text-gray-900">Nhà cung cấp</span>
                        <p className="text-xs text-gray-500 mt-1">Cung cấp dịch vụ</p>
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              disabled={isLoadingForm}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold h-10"
            >
              {isLoadingForm ? 'Đang xử lý...' : 'Tiếp tục'}
            </Button>

            {/* Login Link */}
            <p className="text-center text-gray-600 text-sm pt-2">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition">
                Đăng nhập
              </Link>
            </p>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleSubmit(onSubmitOTP)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Xác Nhận Email</h2>
              <p className="text-sm text-gray-600">
                Chúng tôi đã gửi mã OTP 6 chữ số đến email của bạn
              </p>
              <p className="text-xs text-gray-500 mt-2">{watch('email')}</p>
            </div>

            {/* OTP Input */}
            <div className="space-y-4">
              <Label className="block text-center text-gray-700 font-medium">Nhập Mã OTP</Label>
              <Controller
                name="otpCode"
                control={control}
                render={({ field }) => <OTPInput value={field.value} onChange={field.onChange} />}
              />
              {errors.otpCode && <p className="text-red-500 text-sm text-center">{errors.otpCode.message}</p>}
            </div>

            {/* Resend Button */}
            <div className="text-center">
              {countdown > 0 ? (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <span className="text-sm">
                    Gửi lại mã trong <span className="font-bold">{countdown}s</span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition"
                >
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoadingOTP || otpCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 disabled:opacity-50"
            >
              {isLoadingOTP ? 'Đang xác nhận...' : 'Hoàn tất Đăng Ký'}
            </Button>

            {/* Back Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('form')}
              className="w-full"
            >
              Quay lại
            </Button>
          </form>
        )}

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-800">
            <strong>Demo OTP:</strong> Nhập 6 chữ số bất kỳ (ví dụ: 123456)
          </p>
        </div>
      </div>
    </div>
  )
}
