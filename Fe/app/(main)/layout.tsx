'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Home, Package, MessageSquare, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 sticky top-0">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">ServiceHub</h1>
          <p className="text-xs text-gray-500 mt-1">Marketplace Dịch Vụ</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink href="/dashboard" icon={<Home className="w-5 h-5" />} label="Trang Chủ" />
          <NavLink href="/profile" icon={<User className="w-5 h-5" />} label="Hồ Sơ Cá Nhân" />
          <NavLink href="/bookings" icon={<Package className="w-5 h-5" />} label="Quản Lý Booking" />
          <NavLink href="/chat" icon={<MessageSquare className="w-5 h-5" />} label="Chat & Hỗ Trợ" />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <aside className="fixed inset-0 z-40 md:hidden bg-white w-64 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-lg font-bold text-blue-600">ServiceHub</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <NavLink href="/dashboard" icon={<Home className="w-5 h-5" />} label="Trang Chủ" onClick={() => setSidebarOpen(false)} />
            <NavLink href="/profile" icon={<User className="w-5 h-5" />} label="Hồ Sơ Cá Nhân" onClick={() => setSidebarOpen(false)} />
            <NavLink href="/bookings" icon={<Package className="w-5 h-5" />} label="Quản Lý Booking" onClick={() => setSidebarOpen(false)} />
            <NavLink href="/chat" icon={<MessageSquare className="w-5 h-5" />} label="Chat & Hỗ Trợ" onClick={() => setSidebarOpen(false)} />
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Đăng Xuất</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 flex-1 ml-4 md:ml-0">Marketplace Dịch Vụ</h2>
          <div className="flex items-center gap-2">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=customer123"
              alt="User Avatar"
              className="w-10 h-10 rounded-full"
            />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string
  icon: ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition duration-200"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
