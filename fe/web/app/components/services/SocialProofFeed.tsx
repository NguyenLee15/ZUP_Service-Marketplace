'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, X } from 'lucide-react';

const mockActivities = [
  { id: 1, user: 'Anh Hoàng', action: 'vừa đặt', service: 'Sửa máy lạnh', area: 'Cầu Giấy' },
  { id: 2, user: 'Chị Lan', action: 'vừa hoàn thành', service: 'Vệ sinh máy giặt', area: 'Quận 7' },
  { id: 3, user: 'Minh Tuấn', action: 'vừa đánh giá 5 sao', service: 'Sửa điện nước', area: 'Thanh Xuân' },
  { id: 4, user: 'Bảo Ngọc', action: 'vừa đặt', service: 'Sơn nhà trọn gói', area: 'Hoàn Kiếm' },
];

export function SocialProofFeed() {
  const [current, setCurrent] = useState<ApiPayload>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isVisible) {
        const random = mockActivities[Math.floor(Math.random() * mockActivities.length)];
        setCurrent(random);
        setIsVisible(true);
        
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    }, 15000); // Hiện mỗi 15 giây

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && current && (
        <motion.div
          initial={{ opacity: 0, x: -50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          className="fixed bottom-24 left-6 z-[100] max-w-[280px]"
        >
          <div className="surface-card bg-white/95 backdrop-blur-xl rounded-[20px] p-4 flex items-center gap-3 relative group shadow-[var(--brand-shadow-card)]">
            <div className="w-10 h-10 rounded-full bg-action-blue flex items-center justify-center text-white shrink-0 shadow-[var(--brand-shadow-sm)]">
              {current.action.includes('đặt') ? <ShoppingBag className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-action-blue uppercase tracking-widest mb-0.5">Hoạt động trực tiếp</p>
              <p className="text-sm text-midnight-indigo leading-snug">
                <span className="font-bold">{current.user}</span> {current.action}{' '}
                <span className="font-bold text-action-blue">{current.service}</span>
              </p>
              <p className="text-[10px] text-slate-blue mt-1 font-medium">Tại {current.area} • vừa xong</p>
            </div>
            <button 
              type="button"
              onClick={() => setIsVisible(false)}
              aria-label="Đóng thông báo hoạt động"
              className="absolute -top-2 -right-2 w-5 h-5 bg-pale-gray rounded-full flex items-center justify-center text-slate-blue opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
