"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  BarChart3,
  Menu,
  X,
  ClipboardList,
  Calendar,
  Clock,
  DoorOpen,
  CreditCard,
  Zap,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { useQueueEvents } from "@/hooks/use-queue-events";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { name: "Pre-consultations", href: "/pre-consultations", icon: ClipboardList, permission: "pre_consultations.view" },
  { name: "Agenda", href: "/agenda", icon: Calendar, permission: "patients.view" },
  { name: "Salle d'attente", href: "/salle-attente", icon: Clock, permission: "patients.view" },
  { name: "Séances en cours", href: "/seance-active", icon: Zap, permission: "sessions.create" },
  { name: "Mes patients", href: "/mes-patients", icon: Stethoscope, permission: "sessions.create" },
  { name: "Patients", href: "/patients", icon: Users, permission: "patients.view" },
  { name: "Paiements", href: "/paiements", icon: CreditCard, permission: "dashboard.view" },
  { name: "Analytiques", href: "/analytiques", icon: BarChart3, permission: "dashboard.view" },
  { name: "Configuration", href: "/configuration", icon: Settings, permission: "config.questionnaire" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuthStore();
  const { newCheckInCount: queueNotifications } = useQueueEvents();

  const filteredNav = navigation.filter((item) => hasPermission(item.permission));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Mobile: fixed drawer, Desktop: static in flex container */}
      <aside
        className={cn(
          "flex flex-col bg-card border-r",
          // Mobile: fixed drawer
          "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 lg:transition-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: static, always visible
          "lg:static lg:translate-x-0 lg:w-64 lg:shrink-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-base">SA</span>
            </div>
            <span className="font-semibold text-xl">SalonApp</span>
          </Link>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {filteredNav.length === 0 && (
            <p className="text-sm text-muted-foreground text-center px-4 py-8">
              Aucun acces configure. Contactez un administrateur.
            </p>
          )}
          <ul className="space-y-1">
            {filteredNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl font-medium transition-colors",
                      "min-h-[48px] px-4",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                    {item.href === "/salle-attente" && queueNotifications > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-semibold">
                        {queueNotifications}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Box info */}
        {user?.role_nom === "Praticien" && (
          <div className="border-t px-4 py-3">
            <div className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              {user.box_nom ? (
                <>
                  <span className="text-sm font-medium truncate">{user.box_nom}</span>
                  <Link
                    href="/select-box"
                    onClick={onClose}
                    className="ml-auto text-xs text-primary hover:underline shrink-0"
                  >
                    Changer
                  </Link>
                </>
              ) : (
                <Link
                  href="/select-box"
                  onClick={onClose}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Choisir un box
                </Link>
              )}
            </div>
          </div>
        )}

        {/* User info */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.prenom?.[0]}
                {user?.nom?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.role_nom}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={async () => {
              await logout();
              window.location.href = "/login";
            }}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>
    </>
  );
}

// Mobile bottom navigation bar
export function MobileNav() {
  const pathname = usePathname();
  const { hasPermission } = useAuthStore();
  const { newCheckInCount: queueNotifications } = useQueueEvents();

  const filteredNav = navigation.filter((item) => hasPermission(item.permission));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t lg:hidden safe-bottom"
      aria-label="Navigation principale"
    >
      {/* Height: 64px for comfortable thumb reach */}
      <div className="flex items-center justify-around h-16 px-2">
        {filteredNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // Touch target: 48x48px minimum
                "flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] px-3 rounded-xl transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-6 w-6 transition-transform", isActive && "scale-110")} />
                {item.href === "/salle-attente" && queueNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                    {queueNotifications}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-tight",
                isActive && "font-semibold"
              )}>
                {item.name.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Hamburger menu button for mobile
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={onClick}
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
}
