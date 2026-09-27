export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  // VERCEL_URL is the unique per-deployment hostname, not the canonical
  // domain — using it here would emit sitemap/canonical URLs on a host
  // Search Console won't accept for a sitemap fetched from another origin.
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}
