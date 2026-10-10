import type { NextConfig } from "next";

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
};

export default nextConfig;
