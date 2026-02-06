import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useQueueEvents } from "@/hooks/use-queue-events";
import {
  LayoutGrid,
  Calendar,
  Users,
  FileText,
  CreditCard,
  LogOut,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { useState } from "react";

export const Route = createFileRoute("/secretary")({
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
  component: SecretaryShell,
});

const navItems: Array<{ to: string; label: string; icon: typeof LayoutGrid; exact?: boolean }> = [
  { to: "/secretary", label: "File d'attente", icon: LayoutGrid, exact: true },
  { to: "/secretary/agenda", label: "Agenda", icon: Calendar },
  { to: "/secretary/patients", label: "Patients", icon: Users },
  { to: "/secretary/pre-consultations", label: "Pre-consult.", icon: FileText },
  { to: "/secretary/paiements", label: "Paiements", icon: CreditCard },
];

function SecretaryShell() {
  const { user, logout } = useAuthStore();
  const { newCheckInCount } = useQueueEvents({
    showToasts: true,
    invalidateQueries: true,
  });
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <img src="/Logo_Optiskin_400x400.png" alt="Optiskin" className="h-9 w-9 object-contain" />
          <span className="font-semibold">Optiskin</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/secretary"}
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
              {item.to === "/secretary" && newCheckInCount > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                  {newCheckInCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role_nom}</p>
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

      {/* Main */}
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
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/secretary"}
              activeOptions={{ exact: item.exact ?? false }}
              className="flex flex-col items-center gap-0.5 py-1 px-2 text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.to === "/secretary" && newCheckInCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                    {newCheckInCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
