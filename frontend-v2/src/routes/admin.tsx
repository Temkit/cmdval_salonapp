import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useQueueEvents } from "@/hooks/use-queue-events";
import {
  BarChart3,
  LayoutGrid,
  Calendar,
  Users,
  FileText,
  CreditCard,
  Activity,
  Settings,
  LogOut,
  MapPin,
  Package,
  Percent,
  UserCog,
  ClipboardList,
  Shield,
  DoorOpen,
  KeyRound,
  Wallet,
  UserX,
  FilePen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { useState } from "react";

export const Route = createFileRoute("/admin")({
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
  component: AdminShell,
});

const mainNav: Array<{ to: string; label: string; icon: typeof BarChart3; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/admin/queue", label: "File d'attente", icon: LayoutGrid },
  { to: "/admin/agenda", label: "Agenda", icon: Calendar },
  { to: "/admin/patients", label: "Patients", icon: Users },
  { to: "/admin/pre-consultations", label: "Pre-consult.", icon: FileText },
  { to: "/admin/sessions", label: "Seances", icon: Activity },
  { to: "/admin/paiements", label: "Paiements", icon: CreditCard },
  { to: "/admin/absences", label: "Absences", icon: UserX },
];

const configNav: Array<{ to: string; label: string; icon: typeof MapPin }> = [
  { to: "/admin/config/zones", label: "Zones", icon: MapPin },
  { to: "/admin/config/packs", label: "Packs", icon: Package },
  { to: "/admin/config/promotions", label: "Promotions", icon: Percent },
  { to: "/admin/config/users", label: "Utilisateurs", icon: UserCog },
  { to: "/admin/config/questionnaire", label: "Questionnaire", icon: ClipboardList },
  { to: "/admin/config/roles", label: "Roles", icon: Shield },
  { to: "/admin/config/boxes", label: "Cabines", icon: DoorOpen },
  { to: "/admin/config/paiements", label: "Paiements", icon: Wallet },
  { to: "/admin/config/documents", label: "Documents", icon: FilePen },
];

function AdminShell() {
  const { user, logout } = useAuthStore();
  const { newCheckInCount } = useQueueEvents({
    showToasts: true,
    invalidateQueries: true,
  });
  const [configOpen, setConfigOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-card h-screen sticky top-0">
        <div className="flex h-16 items-center gap-2 border-b px-6 shrink-0">
          <img src="/Logo_Optiskin_400x400.png" alt="Optiskin" className="h-9 w-9 object-contain" />
          <span className="font-semibold">Optiskin</span>
          <span className="text-xs text-muted-foreground ml-auto">Admin</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {mainNav.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/admin"}
              activeOptions={{ exact: item.exact ?? false }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
              )}
              activeProps={{
                className: "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.to === "/admin/queue" && newCheckInCount > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                  {newCheckInCount}
                </span>
              )}
            </Link>
          ))}

          <div className="pt-4">
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground w-full"
            >
              <Settings className="h-5 w-5" />
              Configuration
              <svg
                className={cn("ml-auto h-4 w-4 transition-transform", configOpen && "rotate-180")}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {configOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {configNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to as "/admin"}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                    )}
                    activeProps={{
                      className: "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="border-t p-4 shrink-0">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-muted-foreground truncate">Administrateur</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => setPasswordOpen(true)}>
            <KeyRound className="h-4 w-4" />
            Changer mot de passe
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Deconnexion
          </Button>
        </div>
      </aside>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden flex h-14 items-center justify-between border-b px-4 bg-card">
          <div className="flex items-center gap-2">
            <img src="/Logo_Optiskin_400x400.png" alt="Optiskin" className="h-8 w-8 object-contain" />
            <span className="font-semibold text-sm">Optiskin</span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        <nav className="lg:hidden flex items-center justify-around border-t bg-card safe-area-bottom h-16">
          {mainNav.slice(0, 5).map((item) => (
            <Link
              key={item.to}
              to={item.to as "/admin"}
              activeOptions={{ exact: item.exact ?? false }}
              className="flex flex-col items-center gap-0.5 py-1 px-2 text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
