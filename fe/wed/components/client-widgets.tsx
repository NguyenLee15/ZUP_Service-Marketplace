"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

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

  // Không hiển thị widget trên các trang Auth hoặc Admin
  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ].some((path) => pathname?.includes(path));
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAuthPage || isAdminPage) return null;

  return (
    <>
      <BackToTop />
      <SocialFloatingWidget />
      <ChatWidget />
    </>
  );
}
