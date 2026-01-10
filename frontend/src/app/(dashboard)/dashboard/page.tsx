"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Users, Calendar, TrendingUp, Activity, Plus, ArrowRight, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveRegion, useAnnouncer } from "@/components/ui/live-region";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { announce, Announcer } = useAnnouncer();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.getDashboardStats(),
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: () => api.getRecentActivity(5),
  });

  // Announce when stats load
  useEffect(() => {
    if (stats && !isLoading) {
      announce(
        `Tableau de bord chargé. ${stats.sessions_today || 0} séances aujourd'hui, ${stats.total_patients || 0} patients au total.`
      );
    }
  }, [stats, isLoading, announce]);

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Chargement du tableau de bord">
        {/* Header skeleton - matches actual header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 skeleton rounded-lg" />
            <div className="h-5 w-64 skeleton rounded-md" />
          </div>
          <div className="h-12 w-40 skeleton rounded-lg" />
        </div>

        {/* Metrics skeleton - matches card layout */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-16 skeleton rounded" />
                    <div className="h-8 w-12 skeleton rounded" />
                    <div className="h-3 w-20 skeleton rounded" />
                  </div>
                  <div className="h-10 w-10 skeleton rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions skeleton */}
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-32 skeleton rounded-xl" />
          ))}
        </div>

        {/* Activity skeleton - matches list items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="h-6 w-32 skeleton rounded" />
            <div className="h-4 w-48 skeleton rounded mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="h-10 w-10 skeleton rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 skeleton rounded" />
                    <div className="h-3 w-24 skeleton rounded" />
                  </div>
                  <div className="h-4 w-16 skeleton rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Screen reader announcements */}
      <Announcer mode="polite" />

      {/* Header - F-pattern: Key info top-left, actions top-right */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="heading-1">Tableau de bord</h1>
          <p className="text-secondary mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>

        {/* Primary action - prominent */}
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/patients/nouveau">
            <Plus className="h-5 w-5 mr-2" />
            Nouveau patient
          </Link>
        </Button>
      </div>

      {/* Key Metrics - Most important info first, scannable */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Primary metric - largest visual weight */}
        <Card className="col-span-2 lg:col-span-1 bg-primary text-primary-foreground">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Aujourd'hui</p>
                <p className="metric-value mt-1 text-primary-foreground">
                  {stats?.sessions_today || 0}
                </p>
                <p className="text-primary-foreground/70 text-xs mt-1">séances</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary metrics */}
        <MetricCard
          label="Ce mois"
          value={stats?.sessions_this_month || 0}
          sublabel="séances"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          label="Total patients"
          value={stats?.total_patients || 0}
          sublabel={`+${stats?.new_patients_this_month || 0} ce mois`}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          label="Total séances"
          value={stats?.total_sessions || 0}
          sublabel="effectuées"
          icon={<Zap className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions - Secondary importance */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <QuickActionButton href="/patients" icon={<Users className="h-5 w-5" />} label="Patients" />
        <QuickActionButton href="/analytiques" icon={<TrendingUp className="h-5 w-5" />} label="Analytiques" />
        <QuickActionButton href="/configuration" icon={<Activity className="h-5 w-5" />} label="Configuration" />
      </div>

      {/* Recent Activity - Tertiary importance, progressive disclosure */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="heading-4">Activité récente</CardTitle>
            <p className="text-secondary mt-0.5">Dernières séances effectuées</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/analytiques" className="gap-1">
              Tout voir
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivity?.activities?.length ? (
            <div className="space-y-1">
              {recentActivity.activities.map((activity: any) => (
                <Link
                  key={activity.id}
                  href={`/patients/${activity.patient_id}`}
                  className="flex items-center gap-3 p-3 -mx-3 rounded-xl hover:bg-muted transition-colors"
                >
                  {/* Avatar - visual anchor */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-primary">
                      {activity.patient_prenom?.[0]}
                      {activity.patient_nom?.[0]}
                    </span>
                  </div>

                  {/* Info - hierarchy: name > zone > practitioner */}
                  <div className="flex-1 min-w-0">
                    <p className="text-primary-emphasis truncate">
                      {activity.patient_prenom} {activity.patient_nom}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" size="sm">{activity.zone_nom}</Badge>
                      <span className="text-tertiary truncate">{activity.praticien_nom}</span>
                    </div>
                  </div>

                  {/* Time - tertiary info */}
                  <span className="text-tertiary shrink-0">
                    {formatRelativeDate(new Date(activity.date))}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Metric Card Component - consistent hierarchy
function MetricCard({
  label,
  value,
  sublabel,
  icon
}: {
  label: string;
  value: number | string;
  sublabel: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="metric-label">{label}</p>
            <p className="metric-value mt-1">{value}</p>
            <p className="text-tertiary mt-1">{sublabel}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action Button
function QuickActionButton({
  href,
  icon,
  label
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border",
        "bg-card hover:bg-muted hover:border-primary/30 transition-colors",
        "whitespace-nowrap shrink-0"
      )}
    >
      <span className="text-primary">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
        <Activity className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-primary-emphasis">Aucune activité</p>
      <p className="text-secondary mt-1">Les séances apparaîtront ici</p>
      <Button asChild size="sm" className="mt-4">
        <Link href="/patients">Voir les patients</Link>
      </Button>
    </div>
  );
}

// Relative date formatter
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
