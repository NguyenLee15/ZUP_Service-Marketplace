"use client";

import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState, type ComponentType } from "react";

type SimpleComponent = ComponentType<Record<string, never>>;
type ChatComponent = ComponentType<{ initialOpen?: boolean }>;

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

  useEffect(() => {
    if (hidden || SocialFloatingWidget) return;

    let scheduled = false;

    const loadSocialWidget = () => {
      void import("@/components/social/SocialWidgets").then((mod) => {
        setSocialFloatingWidget(() => mod.SocialFloatingWidget);
      });
    };

    const scheduleLoad = () => {
      if (scheduled) return;
      scheduled = true;

      const win = window as Window & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions,
        ) => number;
      };

      if (win.requestIdleCallback) {
        win.requestIdleCallback(loadSocialWidget, { timeout: 2_500 });
        return;
      }

      window.setTimeout(loadSocialWidget, 800);
    };

    window.addEventListener("pointerdown", scheduleLoad, { once: true, passive: true });
    window.addEventListener("keydown", scheduleLoad, { once: true });

    return () => {
      window.removeEventListener("pointerdown", scheduleLoad);
      window.removeEventListener("keydown", scheduleLoad);
    };
  }, [SocialFloatingWidget, hidden]);

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
          <MessageSquare className="h-6 w-6" />
        </button>
      )}
    </>
  );
}
