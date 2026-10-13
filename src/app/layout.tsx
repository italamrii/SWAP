import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { APP_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/env";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE} | سوق أجهزة الكمبيوتر المستعملة`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: "SWAP",
  keywords: ["كمبيوتر مستعمل", "كرت شاشة مستعمل", "لابتوب مستعمل", "تجميعة قيمنق", "بدل", "حراج كمبيوتر", "السعودية"],
  openGraph: { type: "website", locale: "ar_SA", siteName: SITE_NAME, title: `${SITE_NAME} — ${SITE_TAGLINE}`, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1113" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <ThemeProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:rounded-md focus:bg-graphite focus:px-3 focus:py-2 focus:text-background">
            تخطَّ إلى المحتوى
          </a>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
