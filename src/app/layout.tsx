import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import "./globals.css";

// Components
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { ToastProvider } from "@/components/ui/use-toast";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { StructuredData } from "@/components/seo/structured-data";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "WorldVibe | Global Emotional Check-In Platform",
    template: "%s | WorldVibe",
  },
  description: "Share your feelings anonymously and explore the world's emotional pulse in real-time. Join a global community tracking emotions across countries with interactive visualizations.",
  keywords: [
    "emotional check-in",
    "global mood tracker",
    "anonymous feelings",
    "mental health",
    "emotional wellness",
    "world emotions",
    "mood tracking",
    "emotional data visualization",
    "global community",
    "real-time emotions"
  ],
  authors: [{ name: "WorldVibe Team" }],
  creator: "WorldVibe",
  publisher: "WorldVibe",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://worldvibe.com",
    title: "WorldVibe | Global Emotional Check-In Platform",
    description: "Share your feelings anonymously and explore the world's emotional pulse in real-time.",
    siteName: "WorldVibe",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "WorldVibe - Global Emotional Pulse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WorldVibe | Global Emotional Check-In Platform",
    description: "Share your feelings anonymously and explore the world's emotional pulse in real-time.",
    images: ["/og-image.svg"],
    creator: "@worldvibe",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} antialiased`}>
        <Providers>
          {/* Add ToastProvider from our custom implementation */}
          <ToastProvider>
            <ErrorBoundary>
              <div className="flex min-h-screen flex-col">
                <Suspense fallback={<LoadingSpinner />}>
                  <Header />
                </Suspense>

                <main className="flex-1">
                  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
                </main>

                <Footer />
              </div>

              {/* Keep the existing Sonner Toaster for backward compatibility */}
              <Toaster 
                position="bottom-right" 
                closeButton 
                duration={4000} 
                theme="system" 
                richColors
              />
            </ErrorBoundary>

            {/* SEO & Analytics */}
            <StructuredData type="webapp" />
            <GoogleAnalytics />
            <Analytics />
            <SpeedInsights />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}