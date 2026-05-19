"use client";

import Script from "next/script";
import type { ReactNode } from "react";
import { Facebook, MessageCircle, Phone, Play, Send } from "lucide-react";
import { usePublicSocialConfig } from "@/features/settings/hooks/usePublicSocialConfig";

function buildZaloUrl(phone?: string, chatUrl?: string) {
  if (chatUrl) return chatUrl;
  if (phone) return `https://zalo.me/${phone.replace(/\D/g, "")}`;
  return "";
}

function getTikTokVideoId(url?: string) {
  if (!url) return "";
  return url.match(/\/video\/(\d+)/)?.[1] || "";
}

export function SocialFloatingWidget() {
  const { config, loading } = usePublicSocialConfig();
  if (loading || !config?.enabled) return null;

  const zaloUrl = buildZaloUrl(config.zalo?.phone, config.zalo?.chatUrl);
  const facebookUrl = config.facebook?.pageUrl || "";
  const tiktokUrl = config.tiktok?.profileUrl || config.tiktok?.videoUrl || "";

  const items = [
    zaloUrl && {
      label: "Liên hệ Zalo",
      href: zaloUrl,
      className: "bg-[#0068ff] text-white hover:bg-[#0052cc]",
      icon: <MessageCircle className="size-5" />,
    },
    facebookUrl && {
      label: "Facebook HomeService",
      href: facebookUrl,
      className: "bg-[#1877f2] text-white hover:bg-[#145dbd]",
      icon: <Facebook className="size-5" />,
    },
    tiktokUrl && {
      label: "TikTok HomeService",
      href: tiktokUrl,
      className: "bg-neutral-950 text-white hover:bg-neutral-800",
      icon: <Play className="size-5" />,
    },
    config.zalo?.phone && {
      label: "Gọi hỗ trợ",
      href: `tel:${config.zalo.phone}`,
      className: "bg-emerald-600 text-white hover:bg-emerald-700",
      icon: <Phone className="size-5" />,
    },
  ].filter(Boolean) as Array<{
    label: string;
    href: string;
    className: string;
    icon: ReactNode;
  }>;

  if (!items.length) return null;

  return (
    <div className="fixed bottom-6 left-4 z-50 hidden flex-col gap-2 sm:flex">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target={item.href.startsWith("http") ? "_blank" : undefined}
          rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
          aria-label={item.label}
          className={`flex size-11 items-center justify-center rounded-full shadow-lg transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${item.className}`}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

export function FooterSocialLinks() {
  const { config, loading } = usePublicSocialConfig();
  if (loading || !config?.enabled) return null;

  const zaloUrl = buildZaloUrl(config.zalo?.phone, config.zalo?.chatUrl);
  const links = [
    zaloUrl && {
      label: "Zalo",
      href: zaloUrl,
      icon: <Send className="size-5" />,
    },
    config.facebook?.pageUrl && {
      label: "Facebook",
      href: config.facebook.pageUrl,
      icon: <Facebook className="size-5" />,
    },
    (config.tiktok?.profileUrl || config.tiktok?.videoUrl) && {
      label: "TikTok",
      href: config.tiktok.profileUrl || config.tiktok.videoUrl || "",
      icon: <Play className="size-5" />,
    },
  ].filter(Boolean) as Array<{ label: string; href: string; icon: ReactNode }>;

  if (!links.length) return null;

  return (
    <div className="flex items-center gap-3 pt-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className="flex size-10 items-center justify-center rounded-xl bg-pale-gray text-slate-blue transition-[background-color,color,transform] hover:-translate-y-0.5 hover:bg-action-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

export function SocialFeedSection() {
  const { config, loading } = usePublicSocialConfig();
  if (loading || !config?.enabled) return null;

  const facebookUrl = config.facebook?.pageUrl || "";
  const tiktokVideoUrl = config.tiktok?.videoUrl || "";
  const tiktokVideoId = getTikTokVideoId(tiktokVideoUrl);
  const zaloUrl = buildZaloUrl(config.zalo?.phone, config.zalo?.chatUrl);

  if (!facebookUrl && !tiktokVideoUrl && !zaloUrl) return null;

  return (
    <section className="mt-10 rounded-2xl border border-platinum-tint bg-cloud-mist/60 p-5">
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-glacier-blue">
          Kết nối cộng đồng
        </p>
        <h3 className="text-lg font-semibold text-midnight-indigo">
          Theo dõi HomeService trên các kênh chính thức
        </h3>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {facebookUrl && (
          <div className="overflow-hidden rounded-xl bg-white p-3 shadow-[var(--brand-shadow-sm)]">
            <iframe
              title="Facebook HomeService"
              src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebookUrl)}&tabs=timeline&width=500&height=260&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`}
              width="100%"
              height="260"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              className="border-0"
            />
          </div>
        )}

        {tiktokVideoUrl && tiktokVideoId ? (
          <div className="overflow-hidden rounded-xl bg-white p-3 shadow-[var(--brand-shadow-sm)]">
            <blockquote
              className="tiktok-embed"
              cite={tiktokVideoUrl}
              data-video-id={tiktokVideoId}
              style={{ maxWidth: 605, minWidth: 280 }}
            >
              <section>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={tiktokVideoUrl}
                >
                  Xem video TikTok của HomeService
                </a>
              </section>
            </blockquote>
            <Script
              src="https://www.tiktok.com/embed.js"
              strategy="lazyOnload"
            />
          </div>
        ) : (
          zaloUrl && (
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[180px] items-center justify-between rounded-xl bg-white p-5 shadow-[var(--brand-shadow-sm)] transition-transform hover:-translate-y-0.5"
            >
              <div>
                <p className="text-sm font-semibold text-midnight-indigo">
                  Hỗ trợ qua Zalo
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-blue">
                  Nhắn tin trực tiếp để được tư vấn dịch vụ và xử lý yêu cầu
                  nhanh hơn.
                </p>
              </div>
              <MessageCircle className="size-10 text-action-blue" />
            </a>
          )
        )}
      </div>
      {config.zalo?.oaId && (
        <>
          <div
            className="zalo-chat-widget"
            data-oaid={config.zalo.oaId}
            data-welcome-message="HomeService sẵn sàng hỗ trợ bạn."
            data-autopopup="0"
            data-width="320"
            data-height="420"
          />
          <Script
            src="https://sp.zalo.me/plugins/sdk.js"
            strategy="lazyOnload"
          />
        </>
      )}
    </section>
  );
}
