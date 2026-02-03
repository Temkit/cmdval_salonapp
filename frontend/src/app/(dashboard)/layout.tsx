"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SkipLink } from "@/components/ui/skip-link";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Spinner } from "@/components/ui/spinner";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, refreshUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    const checkAuth = async () => {
      await refreshUser();
      const state = useAuthStore.getState();
      if (!state.isAuthenticated) {
        router.replace("/login");
      } else if (
        state.user &&
        state.user.role_nom === "Praticien" &&
        !state.user.box_id &&
        pathname !== "/select-box"
      ) {
        router.replace("/select-box");
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router, refreshUser, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">SA</span>
          </div>
          <Spinner size="lg" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Skip link for accessibility */}
      <SkipLink href="#main-content" />

      <div className="h-screen bg-muted/30 flex overflow-hidden">
        {/* Desktop Sidebar - only render on desktop */}
        {isDesktop && <Sidebar isOpen={true} onClose={() => {}} />}

        {/* Main content area - scrollable */}
        <div className={isDesktop ? "flex-1 flex flex-col h-screen" : "flex-1 flex flex-col h-screen pb-20"}>
          <main
            id="main-content"
            className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6"
            tabIndex={-1}
          >
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>

        {/* Mobile/Tablet bottom navigation - only render on non-desktop */}
        {!isDesktop && <BottomNav />}
      </div>
    </>
  );
}
