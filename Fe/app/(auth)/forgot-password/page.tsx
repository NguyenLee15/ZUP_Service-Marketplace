'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, RotateCcw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const step1Schema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

const step2Schema = z
  .object({
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(6, 'Xác nhận mật khẩu không được để trống'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })

type Step1FormData = z.infer<typeof step1Schema>
type Step2FormData = z.infer<typeof step2Schema>

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Step 1: Email form
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
    watch: watchStep1,
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    mode: 'onChange',
  })

  // Step 2: Password reset form
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2 },
    watch: watchStep2,
  } = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    mode: 'onChange',
  })

  const onSubmitStep1 = async (data: Step1FormData) => {
    setIsLoading(true)
    try {
      console.log('Forgot password - Email:', data.email)
      // Simulate API call to send reset link
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setUserEmail(data.email)
      setStep('reset')
    } catch (error) {
      console.error('Send reset link error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitStep2 = async (data: Step2FormData) => {
    setIsLoading(true)
    try {
      console.log('Reset password:', {
        email: userEmail,
        newPassword: data.password,
      })
      // Simulate API call to reset password
      await new Promise((resolve) => setTimeout(resolve, 1500))
      alert('Mật khẩu đã được thay đổi thành công! Vui lòng đăng nhập lại.')
      // Redirect to login
      setStep('email')
      setUserEmail('')
    } catch (error) {
      console.error('Reset password error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const password = watchStep2('password')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center text-white">
              <RotateCcw size={24} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'email' ? 'Quên Mật Khẩu' : 'Đặt Lại Mật Khẩu'}
          </h1>
          <p className="text-gray-600 text-sm">
            {step === 'email'
              ? 'Nhập email của bạn để nhận liên kết đặt lại mật khẩu'
              : 'Nhập mật khẩu mới của bạn'}
          </p>
        </div>

        {/* Step 1: Email Input */}
        {step === 'email' && (
          <form onSubmit={handleSubmitStep1} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email đăng ký
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                {...registerStep1('email')}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errorsStep1.email && <p className="text-red-500 text-sm">{errorsStep1.email.message}</p>}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p>
                Chúng tôi sẽ gửi một liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư đến
                hoặc thư spam.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold h-10"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi Liên Kết Đặt Lại'}
            </Button>

            {/* Back to Login */}
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition"
            >
              <ArrowLeft size={16} />
              Quay lại Đăng Nhập
            </Link>
          </form>
        )}

        {/* Step 2: Password Reset */}
        {step === 'reset' && (
          <form onSubmit={handleSubmitStep2} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {/* Email Display */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600">Đặt lại mật khẩu cho:</p>
              <p className="text-sm font-semibold text-gray-900 break-all">{userEmail}</p>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...registerStep2('password')}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errorsStep2.password && <p className="text-red-500 text-sm">{errorsStep2.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                Xác nhận mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...registerStep2('confirmPassword')}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errorsStep2.confirmPassword && (
                <p className="text-red-500 text-sm">{errorsStep2.confirmPassword.message}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p className="font-semibold mb-2">Yêu cầu mật khẩu:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Ít nhất 6 ký tự</li>
                <li>Nên sử dụng chữ hoa, chữ thường và số</li>
                <li>Không sử dụng thông tin cá nhân dễ đoán</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10"
            >
              {isLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
            </Button>

            {/* Back Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('email')}
              className="w-full"
            >
              Sử dụng Email Khác
            </Button>
          </form>
        )}

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-800">
            <strong>Demo:</strong> Sử dụng bất kỳ email nào, mật khẩu mới tối thiểu 6 ký tự
          </p>
        </div>
      </div>
    </div>
  )
}
