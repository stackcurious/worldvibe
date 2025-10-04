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

export const metadata = {
  title: {
    default: "WorldVibe | Global Emotional Pulse",
    template: "%s | WorldVibe",
  },
  description: "Join millions tracking the world's emotional pulse in real-time",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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

            {/* Analytics */}
            <GoogleAnalytics />
            <Analytics />
            <SpeedInsights />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}