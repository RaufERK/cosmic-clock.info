import Script from "next/script";

/**
 * Umami tracker — first-party via nginx `/ua.js` → PM2 umami :3030.
 * Server-rendered so `data-website-id` is on the real <script> tag (tracker needs currentScript).
 */
export function UmamiScript() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!websiteId) {
    return null;
  }

  const src = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "/ua.js";

  return (
    <Script
      src={src}
      strategy="afterInteractive"
      data-website-id={websiteId}
    />
  );
}
