import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useQueueEvents } from "@/hooks/use-queue-events";
import { useState } from "react";
import { Users, LogOut, DoorOpen, KeyRound, Search, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordDialog } from "@/components/change-password-dialog";

export const Route = createFileRoute("/practitioner")({
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
  },
  component: PractitionerShell,
});

function PractitionerShell() {
  const { user, logout } = useAuthStore();
  const { newCheckInCount } = useQueueEvents({
    showToasts: true,
    invalidateQueries: true,
  });
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6 bg-card">
        <div className="flex items-center gap-3">
          <img src="/Logo_Optiskin_400x400.png" alt="Optiskin" className="h-9 w-9 object-contain" />
          <span className="font-semibold hidden sm:block">Optiskin</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/practitioner"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">File d'attente</span>
            {newCheckInCount > 0 && (
              <Badge variant="default" size="sm">{newCheckInCount}</Badge>
            )}
          </Link>

          <div className="h-6 w-px bg-border" />

          <Link
            to="/practitioner/mes-patients"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Mes patients</span>
          </Link>

          <div className="h-6 w-px bg-border" />

          <Link
            to="/practitioner/mes-seances"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Mes seances</span>
          </Link>

          <div className="h-6 w-px bg-border" />

          <Link
            to="/practitioner/select-box"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <DoorOpen className="h-4 w-4" />
            {user?.box_nom ? (
              <Badge variant="outline" size="sm">{user.box_nom}</Badge>
            ) : (
              <span className="hidden sm:inline">Choisir cabine</span>
            )}
          </Link>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <span className="text-sm font-medium hidden sm:block">Dr. {user?.nom}</span>
          </div>

          <Button variant="ghost" size="icon-sm" onClick={() => setPasswordOpen(true)} title="Changer mot de passe">
            <KeyRound className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon-sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
