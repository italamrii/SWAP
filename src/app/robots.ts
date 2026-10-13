import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/api", "/sign-in", "/sign-up", "/onboarding", "/reset-password", "/forgot-password"] }],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
