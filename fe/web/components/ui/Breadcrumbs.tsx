"use client";

import React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const routeMap: Record<string, string> = {
  services: "Dịch vụ",
  bookings: "Lịch đặt",
  profile: "Trang cá nhân",
  chat: "Tin nhắn",
  favorites: "Yêu thích",
  notifications: "Thông báo",
  privacy: "Chính sách bảo mật",
  terms: "Điều khoản sử dụng",
  providers: "Nhà cung cấp",
  create: "Tạo lịch đặt",
  review: "Đánh giá",
  dispute: "Khiếu nại",
  track: "Theo dõi",
  addresses: "Địa chỉ",
  compare: "So sánh",
};

type DynamicCrumbType =
  | "service"
  | "provider"
  | "booking"
  | "admin-booking"
  | "admin-dispute"
  | "admin-kyc";

type DynamicCrumb = {
  cacheKey: string;
  endpoint?: string;
  fallback: string;
  type: DynamicCrumbType;
};

function getStaticLabel(segment: string) {
  return routeMap[segment] || decodeURIComponent(segment);
}

function isNumericSegment(segment: string) {
  return /^\d+$/.test(segment);
}

function compactLabel(label: unknown) {
  return typeof label === "string" && label.trim() ? label.trim() : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getDynamicCrumb(pathSegments: string[], index: number): DynamicCrumb | null {
  const segment = pathSegments[index];
  if (!segment || !isNumericSegment(segment)) return null;

  const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
  const parent = pathSegments[index - 1];
  const grandParent = pathSegments[index - 2];

  if (parent === "services") {
    return {
      cacheKey: href,
      endpoint: `/api/services/${segment}`,
      fallback: "Chi tiết dịch vụ",
      type: "service",
    };
  }

  if (parent === "providers") {
    return {
      cacheKey: href,
      endpoint: `/api/services/providers/${segment}`,
      fallback: "Hồ sơ nhà cung cấp",
      type: "provider",
    };
  }

  if (parent === "bookings" && grandParent !== "admin") {
    return {
      cacheKey: href,
      endpoint: `/api/bookings/${segment}`,
      fallback: "Chi tiết đơn hàng",
      type: "booking",
    };
  }

  if (grandParent === "admin" && parent === "bookings") {
    return {
      cacheKey: href,
      fallback: `Đơn #${segment}`,
      type: "admin-booking",
    };
  }

  if (grandParent === "admin" && parent === "disputes") {
    return {
      cacheKey: href,
      fallback: `Khiếu nại #${segment}`,
      type: "admin-dispute",
    };
  }

  if (grandParent === "admin" && parent === "kyc") {
    return {
      cacheKey: href,
      fallback: `KYC #${segment}`,
      type: "admin-kyc",
    };
  }

  return null;
}

function extractLabel(payload: unknown, type: DynamicCrumbType) {
  const root = asRecord(payload);
  const data = asRecord(root.data ?? payload);

  if (type === "service") {
    return compactLabel(data.name);
  }

  if (type === "provider") {
    return compactLabel(data.fullName) || compactLabel(data.name);
  }

  if (type === "booking") {
    const service = asRecord(data.service);
    return (
      compactLabel(service.name) ||
      compactLabel(data.serviceName) ||
      compactLabel(data.title) ||
      (data.id ? `Chi tiết đơn hàng #${data.id}` : null)
    );
  }

  return null;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});
  const isHome = pathname === "/";
  const paths = pathname.split("/").filter(Boolean);

  useEffect(() => {
    let cancelled = false;
    const pathSegments = pathname.split("/").filter(Boolean);
    const dynamicCrumbs = pathSegments
      .map((_, index) => getDynamicCrumb(pathSegments, index))
      .filter((crumb): crumb is DynamicCrumb => Boolean(crumb));

    if (dynamicCrumbs.length === 0) return;

    setDynamicLabels((current) => {
      const next = { ...current };
      dynamicCrumbs.forEach((crumb) => {
        if (!next[crumb.cacheKey]) next[crumb.cacheKey] = crumb.fallback;
      });
      return next;
    });

    dynamicCrumbs.forEach((crumb) => {
      if (!crumb.endpoint) return;

      fetch(crumb.endpoint, {
        headers: { Accept: "application/json" },
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => {
          const label = extractLabel(payload, crumb.type);
          if (!cancelled && label) {
            setDynamicLabels((current) => ({
              ...current,
              [crumb.cacheKey]: label,
            }));
          }
        })
        .catch(() => {
          /* Giữ fallback nếu không tải được nhãn breadcrumb. */
        });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <nav
      className="flex px-4 py-3 bg-white/5 backdrop-blur-sm rounded-[16px] max-w-7xl mx-auto border border-white/10"
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-2 text-xs font-semibold text-slate-500">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-slate-400 hover:text-cyan-300 transition-colors gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
        </li>
        {isHome ? (
          <li className="flex items-center">
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 mx-1 shrink-0" />
            <span className="text-cyan-400 font-bold">
              Tìm kiếm thợ tại nhà
            </span>
          </li>
        ) : (
          paths.map((path, index) => {
            const href = `/${paths.slice(0, index + 1).join("/")}`;
            const isLast = index === paths.length - 1;
            const dynamicCrumb = getDynamicCrumb(paths, index);
            const label =
              (dynamicCrumb && dynamicLabels[dynamicCrumb.cacheKey]) ||
              dynamicCrumb?.fallback ||
              getStaticLabel(path);

            return (
              <li key={path} className="flex items-center">
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 mx-1 shrink-0" />
                {isLast ? (
                  <span className="text-cyan-400 font-bold truncate max-w-[200px] sm:max-w-none">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    prefetch={false}
                    className="text-slate-400 hover:text-cyan-300 transition-colors truncate max-w-[150px] sm:max-w-none"
                  >
                    {label}
                  </Link>
                )}
              </li>
            );
          })
        )}
      </ol>
    </nav>
  );
}
