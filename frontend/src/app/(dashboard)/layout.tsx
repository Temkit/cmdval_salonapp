"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar, MobileNav, MobileMenuButton } from "@/components/layout/sidebar";
import { SkipLink } from "@/components/ui/skip-link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, refreshUser, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center animate-pulse">
            <span className="text-primary-foreground font-bold text-lg">SA</span>
          </div>
          <div className="text-muted-foreground animate-pulse">Chargement...</div>
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

      <div className="min-h-screen bg-muted/30 lg:flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-card border-b lg:hidden">
          <div className="flex items-center gap-3">
            <MobileMenuButton onClick={() => setSidebarOpen(true)} />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SA</span>
              </div>
              <span className="font-semibold">SalonApp</span>
            </div>
          </div>
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.prenom?.[0]}
              {user?.nom?.[0]}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
    </>
  );
}
