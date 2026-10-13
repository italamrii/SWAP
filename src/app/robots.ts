import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/env";
import { VISUAL_PREVIEW } from "@/lib/visual-preview";

export default function robots(): MetadataRoute.Robots {
  if (VISUAL_PREVIEW) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/api", "/sign-in", "/sign-up", "/onboarding", "/reset-password", "/forgot-password"] }],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
