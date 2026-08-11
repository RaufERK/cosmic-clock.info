"use client";

import Script from "next/script";

/**
 * Umami tracker — first-party via nginx `/ua.js` → PM2 umami :3030.
 * Set NEXT_PUBLIC_UMAMI_WEBSITE_ID (and optional SCRIPT_URL) in env.
 */
export function UmamiScript() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!websiteId) {
    return null;
  }

  const src = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "/ua.js";

  return (
    <Script
      defer
      src={src}
      strategy="afterInteractive"
      data-website-id={websiteId}
    />
  );
}
