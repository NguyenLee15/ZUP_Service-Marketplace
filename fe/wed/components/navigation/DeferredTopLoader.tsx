"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const TopLoader = dynamic(() => import("nextjs-toploader"), {
  ssr: false,
});

export function DeferredTopLoader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const enable = () => setEnabled(true);

    window.addEventListener("pointerdown", enable, { once: true, passive: true });
    window.addEventListener("keydown", enable, { once: true });

    return () => {
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
    };
  }, []);

  if (!enabled) return null;

  return (
    <TopLoader
      color="#2563eb"
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px #2563eb,0 0 5px #2563eb"
      zIndex={1600}
    />
  );
}
