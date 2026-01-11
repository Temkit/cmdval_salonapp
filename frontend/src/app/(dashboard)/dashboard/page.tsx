"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Activity,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { api } from "@/lib/api";
import { formatDistanceToNow, isValid } from "date-fns";
import { fr } from "date-fns/locale";

// Safe date formatter
function safeFormatDistance(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (!isValid(date)) return "";
  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  } catch {
    return "";
  }
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "new-patient",
    label: "Nouveau Patient",
    description: "Créer un profil patient",
    icon: UserPlus,
    href: "/patients/nouveau",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  {
    id: "patients",
    label: "Patients",
    description: "Liste des patients",
    icon: Users,
    href: "/patients",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "active-session",
    label: "Séance Active",
    description: "Reprendre traitement",
    icon: Activity,
    href: "/seance-active",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "analytics",
    label: "Analytiques",
    description: "Voir les stats",
    icon: TrendingUp,
    href: "/analytiques",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
];

export default function HomePage() {
  const router = useRouter();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.getDashboardStats(),
  });

  // Fetch recent activity (which includes recent patients)
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: () => api.getRecentActivity(),
  });

  const handleQuickAction = (action: QuickAction) => {
    haptics.medium();
    router.push(action.href);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "-" : stats?.total_patients ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "-" : stats?.new_patients_this_month ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "-" : stats?.sessions_today ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/20">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "-" : stats?.total_sessions ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Séances</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className={cn(
                    "flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-transparent",
                    "bg-card hover:border-primary/30 active:scale-95 transition-all",
                    "min-h-[120px] text-center"
                  )}
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mb-3",
                      action.bgColor
                    )}
                  >
                    <Icon className={cn("h-7 w-7", action.color)} />
                  </div>
                  <span className="font-semibold text-sm">{action.label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {action.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Activité récente</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/analytiques")}
              className="text-muted-foreground"
            >
              Analytiques
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {activityLoading ? (
            <Card>
              <CardContent className="p-0 divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-xl skeleton shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-48 skeleton rounded" />
                      <div className="h-4 w-24 skeleton rounded" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : activity?.activities?.filter((a: any) => a.description)?.length > 0 ? (
            <Card>
              <CardContent className="p-0 divide-y">
                {activity.activities.filter((a: any) => a.description).slice(0, 5).map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                        item.type === "session"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-green-500/10 text-green-600"
                      )}
                    >
                      {item.type === "session" ? (
                        <Activity className="h-5 w-5" />
                      ) : (
                        <UserPlus className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {safeFormatDistance(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune activite recente
              </CardContent>
            </Card>
          )}
        </section>
    </div>
  );
}
