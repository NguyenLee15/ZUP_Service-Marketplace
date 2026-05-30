"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, startTransition, type ComponentType } from "react";

type SimpleComponent = ComponentType<Record<string, never>>;
type ChatComponent = ComponentType<{ initialOpen?: boolean }>;

function MessageSquareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function ClientWidgets() {
  const pathname = usePathname();
  const [ChatWidget, setChatWidget] = useState<ChatComponent | null>(null);
  const [BackToTop, setBackToTop] = useState<SimpleComponent | null>(null);
  const [SocialFloatingWidget, setSocialFloatingWidget] = useState<SimpleComponent | null>(null);
  const [chatRequested, setChatRequested] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Không hiển thị widget trên các trang Auth hoặc Admin
  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ].some((path) => pathname?.includes(path));
  const isAdminPage = pathname?.startsWith("/admin");
  const hidden = isAuthPage || isAdminPage;

  const loadChatWidget = useCallback(() => {
    setChatRequested(true);
    setShowTooltip(false);

    if (ChatWidget) return;

    startTransition(() => {
      void import("@/components/chatbot/ChatWidget").then((mod) => {
        setChatWidget(() => mod.ChatWidget);
      });
    });
  }, [ChatWidget]);

  // Set timeout to show speech bubble tooltip after 3 seconds if chatbot is not open
  useEffect(() => {
    if (hidden || ChatWidget) return;

    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [ChatWidget, hidden]);

  useEffect(() => {
    if (hidden || BackToTop) return;

    const handleScroll = () => {
      if (window.scrollY < 320) return;
      void import("@/components/navigation/BackToTop").then((mod) => {
        setBackToTop(() => mod.BackToTop);
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [BackToTop, hidden]);

  // SocialFloatingWidget has been disabled as requested by the user

  if (hidden) return null;

  return (
    <>
      {BackToTop && <BackToTop />}
      {SocialFloatingWidget && <SocialFloatingWidget />}
      
      {/* Auto-suggesting AI Chatbot Tooltip speech bubble */}
      {showTooltip && !ChatWidget && (
        <div className="fixed bottom-[calc(5rem_+_env(safe-area-inset-bottom))] right-[calc(1rem_+_env(safe-area-inset-right))] z-50 sm:bottom-24 sm:right-6 animate-[bounce_2s_infinite] max-w-[240px] bg-slate-900/95 backdrop-blur-md border border-cyan-400/35 p-3.5 rounded-2xl shadow-2xl text-xs text-white select-none">
          <button 
            onClick={() => setShowTooltip(false)} 
            className="absolute -top-1.5 -right-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-full p-1 border border-white/10 flex items-center justify-center transition-colors focus-visible:outline-none"
            aria-label="Tắt gợi ý"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div onClick={loadChatWidget} className="cursor-pointer font-bold leading-relaxed text-slate-100 hover:text-cyan-300 transition-colors">
            Chào bạn! Bạn cần tìm thợ gì hôm nay? Để tôi hỗ trợ gợi ý nhé! 🤖
          </div>
          {/* Triangular speech bubble tip */}
          <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-900/95" />
          <div className="absolute -bottom-[9px] right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-cyan-400/35 -z-10" />
        </div>
      )}

      {ChatWidget ? (
        <ChatWidget initialOpen={chatRequested} />
      ) : (
        <button
          id="chat-widget-btn"
          onClick={loadChatWidget}
          aria-label="Mở trợ lý AI"
          className="fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom))] right-[calc(1rem_+_env(safe-area-inset-right))] z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/25 transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
        >
          <MessageSquareIcon />
        </button>
      )}
    </>
  );
}
