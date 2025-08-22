// src/app/dashboard/layout.tsx
import { Suspense } from "react";
import DashboardNav from "@/components/dashboard/nav";
import { DashboardHeader } from "@/components/dashboard/header";
import { FullPageSpinner } from "@/components/shared/loading-spinner";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export const metadata = {
  title: "Dashboard | WorldVibe",
  description: "Overview of WorldVibe analytics",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      {/* Header */}
      <DashboardHeader heading="WorldVibe Dashboard" text="Real-time analytics and insights" />

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block md:w-64 border-r border-gray-700 bg-gray-900 bg-opacity-90 shadow-xl">
          <DashboardNav />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 mt-4 md:mt-0 px-4 py-2 md:px-6 lg:px-8 lg:py-4">
          <ErrorBoundary>
            <Suspense fallback={<FullPageSpinner size="lg" />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
