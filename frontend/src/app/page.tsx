"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      await refreshUser();
      const isAuth = useAuthStore.getState().isAuthenticated;
      if (isAuth) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };
    checkAuth();
  }, [router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Chargement...</div>
    </div>
  );
}
