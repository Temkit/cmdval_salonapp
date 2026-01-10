"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SkipLink } from "@/components/ui/skip-link";
import { Spinner } from "@/components/ui/spinner";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    const checkAuth = async () => {
      await refreshUser();
      const isAuth = useAuthStore.getState().isAuthenticated;
      if (!isAuth) {
        router.replace("/login");
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router, refreshUser]);

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

      <div className="min-h-screen bg-muted/30 flex">
        {/* Desktop Sidebar - only render on desktop */}
        {isDesktop && <Sidebar isOpen={true} onClose={() => {}} />}

        {/* Main content area */}
        <div className={isDesktop ? "flex-1 min-h-screen" : "flex-1 min-h-screen pb-20"}>
          <main
            id="main-content"
            className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>

        {/* Mobile/Tablet bottom navigation - only render on non-desktop */}
        {!isDesktop && <BottomNav />}
      </div>
    </>
  );
}
