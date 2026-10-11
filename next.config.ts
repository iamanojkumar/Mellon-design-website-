import type { NextConfig } from "next";
import { MEDIA_RIGHTS_HEADERS } from "./lib/ai-policy";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The admin assistants read these documents at request time (lib/admin-ai.ts).
  outputFileTracingIncludes: {
    "/admin/api/*": ["./docs/brand-voice.md", "./docs/landing-rules.md"],
  },
  experimental: {
    globalNotFound: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      // Every page: images on it are reserved from AI training. Text carries no
      // restriction, so assistants and search can still read it.
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noimageai" }] },
      // Media: no AI training of any kind (Spawning/DeviantArt "noai" and the
      // W3C TDM Reservation Protocol). Audio is also covered in its own route.
      ...["/images/:path*", "/brand/:path*", "/_next/image"].map((source) => ({
        source,
        headers: MEDIA_RIGHTS_HEADERS,
      })),
    ];
  },
};

export default nextConfig;
