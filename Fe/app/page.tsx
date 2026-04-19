'use client'

import Link from 'next/link'
import { ArrowRight, LogIn, UserPlus, RotateCcw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="font-bold text-xl text-gray-900">Marketplace Dịch Vụ</span>
          </div>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Đăng Nhập</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Kết nối Dịch Vụ <span className="text-blue-600">Chất Lượng</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Nền tảng marketplace hiện đại để khách hàng tìm kiếm dịch vụ và nhà cung cấp trưng bày tài năng của họ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=customer">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                <UserPlus className="mr-2" size={20} />
                Tìm Dịch Vụ
              </Button>
            </Link>
            <Link href="/register?role=provider">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
              >
                <Zap className="mr-2" size={20} />
                Cung Cấp Dịch Vụ
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            {
              icon: '🔐',
              title: 'An Toàn & Bảo Mật',
              description: 'Xác thực hai lớp và mã hóa dữ liệu để bảo vệ tài khoản của bạn',
            },
            {
              icon: '⭐',
              title: 'Đánh Giá Minh Bạch',
              description: 'Xem đánh giá thực từ khách hàng trước khi chọn dịch vụ',
            },
            {
              icon: '💳',
              title: 'Thanh Toán Linh Hoạt',
              description: 'Hỗ trợ nhiều phương thức thanh toán an toàn và tiện lợi',
            },
          ].map((feature, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-lg transition">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Auth Pages Preview */}
      <section className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Hệ Thống Xác Thực</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Login Card */}
            <div className="border-2 border-blue-200 rounded-lg p-8 hover:border-blue-500 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <LogIn size={20} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Đăng Nhập</h3>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Form đăng nhập với xác thực Email và Mật khẩu. Hỗ trợ:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li>✓ Ẩn/Hiện mật khẩu</li>
                <li>✓ Nhớ mật khẩu</li>
                <li>✓ Liên kết quên mật khẩu</li>
                <li>✓ Validation với Zod</li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Xem Trang Đăng Nhập <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>

            {/* Register Card */}
            <div className="border-2 border-green-200 rounded-lg p-8 hover:border-green-500 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <UserPlus size={20} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Đăng Ký & OTP</h3>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Form đăng ký 2 bước với xác thực OTP. Hỗ trợ:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li>✓ Nhập Họ tên, Email, SĐT</li>
                <li>✓ Chọn vai trò (Khách/Nhà cung cấp)</li>
                <li>✓ Input OTP 6 chữ số</li>
                <li>✓ Đếm ngược OTP 60s</li>
              </ul>
              <Link href="/register">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Xem Trang Đăng Ký <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>

            {/* Forgot Password Card */}
            <div className="border-2 border-orange-200 rounded-lg p-8 hover:border-orange-500 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <RotateCcw size={20} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Quên Mật Khẩu</h3>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Form quên mật khẩu 2 bước. Hỗ trợ:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li>✓ Nhập email để nhận link</li>
                <li>✓ Đặt lại mật khẩu mới</li>
                <li>✓ Xác nhận mật khẩu</li>
                <li>✓ Validation mạnh mẽ</li>
              </ul>
              <Link href="/forgot-password">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  Xem Trang Quên MK <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Công Nghệ Sử Dụng</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Next.js 16', desc: 'App Router' },
              { name: 'React 19', desc: 'Hooks & Server Components' },
              { name: 'Tailwind CSS', desc: 'Styling' },
              { name: 'Shadcn UI', desc: 'Components' },
              { name: 'React Hook Form', desc: 'Form Management' },
              { name: 'Zod', desc: 'Validation' },
              { name: 'Lucide React', desc: 'Icons' },
              { name: 'TypeScript', desc: 'Type Safety' },
            ].map((tech, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition">
                <p className="font-semibold text-gray-900">{tech.name}</p>
                <p className="text-xs text-gray-600 mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2026 Marketplace Dịch Vụ. Thiết kế với ❤️ bằng v0</p>
        </div>
      </footer>
    </div>
  )
}
