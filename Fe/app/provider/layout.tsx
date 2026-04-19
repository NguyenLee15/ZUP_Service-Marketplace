'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Package, 
  Wallet, 
  FileText, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X,
  Home,
  User
} from 'lucide-react';

const navigationItems = [
  { href: '/provider', icon: Home, label: 'Dashboard' },
  { href: '/provider/services', icon: Package, label: 'Dịch Vụ' },
  { href: '/provider/wallet', icon: Wallet, label: 'Ví Tiền' },
  { href: '/provider/kyc', icon: FileText, label: 'Xác Thực KYC' },
  { href: '/provider/bookings', icon: BarChart3, label: 'Booking' },
  { href: '/provider/chat', icon: MessageSquare, label: 'Tin Nhắn' },
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          {sidebarOpen && (
            <Link href="/provider" className="font-bold text-lg text-blue-600">
              DV Pro
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Profile & Logout */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Link
            href="/provider/profile"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Hồ Sơ</span>}
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-700"
            onClick={() => {/* Logout handler */}}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Đăng Xuất</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
