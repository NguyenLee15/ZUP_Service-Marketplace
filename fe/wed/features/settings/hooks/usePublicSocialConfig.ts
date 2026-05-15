"use client";

import { useEffect, useState } from "react";
import { publicSettingsApi } from "@/features/auth/services/api";

export interface PublicSocialConfig {
  enabled: boolean;
  zalo?: {
    phone?: string;
    oaId?: string;
    chatUrl?: string;
  };
  facebook?: {
    pageUrl?: string;
  };
  tiktok?: {
    profileUrl?: string;
    videoUrl?: string;
  };
}

export function usePublicSocialConfig() {
  const [config, setConfig] = useState<PublicSocialConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    publicSettingsApi
      .getSocial()
      .then((res) => {
        if (mounted) setConfig(res.data?.data || null);
      })
      .catch(() => {
        if (mounted) setConfig(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading };
}
