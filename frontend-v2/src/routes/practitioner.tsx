import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useQueueEvents } from "@/hooks/use-queue-events";
import { useState } from "react";
import { Users, LogOut, DoorOpen, KeyRound, Search, Activity, FileText } from "lucide-react";
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

const practitionerNav: Array<{ to: string; label: string; icon: typeof Users; permission: string }> = [
  { to: "/practitioner", label: "File d'attente", icon: Users, permission: "queue.view" },
  { to: "/practitioner/mes-patients", label: "Mes patients", icon: Search, permission: "patients.view" },
  { to: "/practitioner/mes-seances", label: "Mes seances", icon: Activity, permission: "sessions.view" },
  { to: "/practitioner/pre-consultations", label: "Pre-consult.", icon: FileText, permission: "pre_consultations.view" },
  { to: "/practitioner/select-box", label: "Cabine", icon: DoorOpen, permission: "boxes.view" },
];

function PractitionerShell() {
  const { user, logout, hasPermission } = useAuthStore();
  const { newCheckInCount } = useQueueEvents({
    showToasts: true,
    invalidateQueries: true,
  });
  const [passwordOpen, setPasswordOpen] = useState(false);

  const visibleNav = practitionerNav.filter((item) => hasPermission(item.permission));

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6 bg-card">
        <div className="flex items-center gap-3">
          <img src="/Logo_Optiskin_400x400.png" alt="Optiskin" className="h-9 w-9 object-contain" />
          <span className="font-semibold hidden sm:block">Optiskin</span>
        </div>

        <div className="flex items-center gap-3">
          {visibleNav.map((item, index) => (
            <span key={item.to} className="contents">
              {index > 0 && <div className="h-6 w-px bg-border" />}
              <Link
                to={item.to}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.to === "/practitioner/select-box" ? (
                  user?.box_nom ? (
                    <Badge variant="outline" size="sm">{user.box_nom}</Badge>
                  ) : (
                    <span className="hidden sm:inline">Choisir cabine</span>
                  )
                ) : (
                  <span className="hidden sm:inline">{item.label}</span>
                )}
                {item.to === "/practitioner" && newCheckInCount > 0 && (
                  <Badge variant="default" size="sm">{newCheckInCount}</Badge>
                )}
              </Link>
            </span>
          ))}

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
