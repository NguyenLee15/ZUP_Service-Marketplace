"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ComponentType } from "react";

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

    if (ChatWidget) return;

    void import("@/components/chatbot/ChatWidget").then((mod) => {
      setChatWidget(() => mod.ChatWidget);
    });
  }, [ChatWidget]);

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
