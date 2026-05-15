'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';
import { notificationsApi } from '@/features/auth/services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.data.data || []);
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.status === 401) {
        // Token hết hạn hoặc user bị xóa do seed DB, tự động logout
        const { useAuthStore } = await import('@/store/auth.store');
        useAuthStore.getState().logout();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-action-blue" /> Thông báo của bạn
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Cập nhật những thông tin mới nhất về dịch vụ và đơn hàng</p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            className="text-action-blue border-platinum-tint hover:bg-pale-gray shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="surface-card rounded-[20px] p-12 text-center border-dashed flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-pale-gray text-action-blue rounded-full flex items-center justify-center mb-4">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có thông báo nào</h3>
          <p className="text-muted-foreground">Bạn sẽ nhận được thông báo khi có cập nhật mới về đơn hàng hoặc tài khoản.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              className={`p-4 md:p-5 rounded-xl border transition-[background-color,border-color,box-shadow] cursor-pointer ${
                notification.isRead 
                  ? 'bg-card border-border opacity-75' 
                  : 'bg-pale-gray/40 border-platinum-tint shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  {notification.isRead ? (
                    <Circle className="w-3 h-3 text-muted-foreground/50 fill-platinum-tint" />
                  ) : (
                    <Circle className="w-3 h-3 text-action-blue fill-action-blue" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <h4 className={`font-semibold text-base ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : 'text-foreground/80'}`}>
                    {notification.content}
                  </p>

                  {notification.referenceId && (
                    <div className="mt-3">
                      <Button variant="link" className="p-0 h-auto text-action-blue font-medium text-sm">
                        Xem chi tiết <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
