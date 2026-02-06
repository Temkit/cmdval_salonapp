import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();

    if (!store.isAuthenticated) {
      try {
        await store.refreshUser();
      } catch {
        throw redirect({ to: "/login" });
      }
      if (!useAuthStore.getState().isAuthenticated) {
        throw redirect({ to: "/login" });
      }
    }

    const user = useAuthStore.getState().user;
    if (!user) throw redirect({ to: "/login" });

    const role = user.role_nom?.toLowerCase() || "";
    if (role === "praticien") {
      throw redirect({ to: "/practitioner" });
    }
    if (role === "admin" || role === "administrateur") {
      throw redirect({ to: "/admin" });
    }
    throw redirect({ to: "/secretary" });
  },
});
