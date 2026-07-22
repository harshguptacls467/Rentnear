import "./globals.css";
import { Providers } from "./providers";
import { PWARegister } from "@/components/pwa-register";
import { FloatingAIChatWrapper } from "@/components/floating-ai-chat-wrapper";
import { ErrorBoundary } from "@/components/error-boundary";
import { Geist } from "next/font/google";
import { cn } from "@/shared/lib/cn";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "FinTech Dashboard",
  description: "Управление личными финансами с AI-аналитикой",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FinTech",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#0F172A",
    "msapplication-navbutton-color": "#0F172A",
  },
};

export const viewport = {
  themeColor: "#0F172A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <meta name="theme-color" content="#0F172A" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/brand-mark.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <ErrorBoundary>
          <Providers>
            {children}
            <FloatingAIChatWrapper />
          </Providers>
        </ErrorBoundary>
        <PWARegister />
      </body>
    </html>
  );
}