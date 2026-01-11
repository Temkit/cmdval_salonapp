"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Users, ClipboardList, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: RegExp;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Accueil",
    icon: Home,
    match: /^\/(dashboard)?$/,
  },
  {
    href: "/patients",
    label: "Patients",
    icon: Users,
    match: /^\/patients/,
  },
  {
    href: "/pre-consultations",
    label: "Pre-consult",
    icon: ClipboardList,
    match: /^\/pre-consultations/,
  },
  {
    href: "/analytiques",
    label: "Stats",
    icon: BarChart3,
    match: /^\/analytiques/,
  },
  {
    href: "/configuration",
    label: "Config",
    icon: Settings,
    match: /^\/configuration/,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const handleTap = () => {
    haptics.selection();
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom lg:hidden"
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match
            ? item.match.test(pathname)
            : pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleTap}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-4 min-w-[64px] min-h-[64px]",
                "transition-all duration-200 active:scale-95",
                "rounded-xl",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-8 rounded-full transition-all duration-200",
                  isActive && "bg-primary/15"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-xs mt-1 font-medium transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-70"
                )}
              >
                {item.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
