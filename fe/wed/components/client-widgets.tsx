"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ChatWidget = dynamic(
  () => import("@/components/chatbot/ChatWidget").then((mod) => mod.ChatWidget),
  { ssr: false },
);
const BackToTop = dynamic(
  () =>
    import("@/components/navigation/BackToTop").then((mod) => mod.BackToTop),
  { ssr: false },
);
const SocialFloatingWidget = dynamic(
  () =>
    import("@/components/social/SocialWidgets").then(
      (mod) => mod.SocialFloatingWidget,
    ),
  { ssr: false },
);

export function ClientWidgets() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  // Không hiển thị widget trên các trang Auth hoặc Admin
  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ].some((path) => pathname?.includes(path));
  const isAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    setReady(false);

    if (isAuthPage || isAdminPage) return;

    const win = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let timeoutId: number | undefined;
    let idleId: number | undefined;

    const showWidgets = () => setReady(true);

    if (win.requestIdleCallback) {
      idleId = win.requestIdleCallback(showWidgets, { timeout: 2_500 });
    } else {
      timeoutId = window.setTimeout(showWidgets, 1_500);
    }

    return () => {
      if (idleId && win.cancelIdleCallback) win.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isAuthPage, isAdminPage]);

  if (isAuthPage || isAdminPage) return null;
  if (!ready) return null;

  return (
    <>
      <BackToTop />
      <SocialFloatingWidget />
      <ChatWidget />
    </>
  );
}
