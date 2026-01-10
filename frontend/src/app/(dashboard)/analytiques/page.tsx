"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Users,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Award,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonGroup } from "@/components/ui/button-group";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const periodOptions = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("month");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.getDashboardStats(),
  });

  const { data: byZone, isLoading: zoneLoading } = useQuery({
    queryKey: ["sessions-by-zone"],
    queryFn: () => api.getSessionsByZone(),
  });

  const { data: byPraticien, isLoading: praticienLoading } = useQuery({
    queryKey: ["sessions-by-praticien"],
    queryFn: () => api.getSessionsByPraticien(),
  });

  const { data: byPeriod, isLoading: periodLoading } = useQuery({
    queryKey: ["sessions-by-period", period],
    queryFn: () => api.getSessionsByPeriod(period),
  });

  // Calculate max values for charts
  const maxZoneCount = Math.max(...(byZone?.data?.map((z: any) => z.count) || [1]));
  const maxPraticienCount = Math.max(...(byPraticien?.data?.map((p: any) => p.count) || [1]));
  const maxPeriodCount = Math.max(...(byPeriod?.data?.map((p: any) => p.count) || [1]));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-1">Analytiques</h1>
          <p className="text-secondary mt-1">
            Statistiques et performances du centre
          </p>
        </div>
        <ButtonGroup
          options={periodOptions}
          value={period}
          onChange={setPeriod}
          size="sm"
          columns={4}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={statsLoading ? "..." : stats?.total_patients || 0}
          description="Patients enregistrés"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Total Séances"
          value={statsLoading ? "..." : stats?.total_sessions || 0}
          description="Séances effectuées"
          icon={<Zap className="h-5 w-5" />}
        />
        <StatCard
          title="Séances aujourd'hui"
          value={statsLoading ? "..." : stats?.sessions_today || 0}
          description="Traitements du jour"
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          title="Séances ce mois"
          value={statsLoading ? "..." : stats?.sessions_month || 0}
          description="Ce mois-ci"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sessions by Zone */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-primary" />
              Séances par zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            {zoneLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 skeleton" />
                    <div className="h-3 skeleton" />
                  </div>
                ))}
              </div>
            ) : (byZone?.data?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {byZone?.data?.map((zone: any) => (
                  <div key={zone.zone_id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate">{zone.zone_nom}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">
                        {zone.count}
                      </span>
                    </div>
                    <Progress
                      value={(zone.count / maxZoneCount) * 100}
                      className="h-2.5"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">
                <PieChart className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions by Praticien */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Séances par praticien
            </CardTitle>
          </CardHeader>
          <CardContent>
            {praticienLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 skeleton" />
                    <div className="h-3 skeleton" />
                  </div>
                ))}
              </div>
            ) : (byPraticien?.data?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {byPraticien?.data?.map((praticien: any, index: number) => (
                  <div key={praticien.praticien_id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Award className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="font-medium truncate">
                          {praticien.praticien_nom}
                        </span>
                      </div>
                      <span className="text-muted-foreground shrink-0 ml-2">
                        {praticien.count}
                      </span>
                    </div>
                    <Progress
                      value={(praticien.count / maxPraticienCount) * 100}
                      className="h-2.5"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">
                <Users className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sessions over Time */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            Évolution des séances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {periodLoading ? (
            <div className="h-48 skeleton" />
          ) : (byPeriod?.data?.length ?? 0) > 0 ? (
            <div className="space-y-4">
              {/* Bar chart */}
              <div className="flex items-end justify-between h-40 gap-1 sm:gap-2 px-1">
                {byPeriod?.data?.slice(-12).map((item: any, index: number) => {
                  const height = maxPeriodCount > 0 ? (item.count / maxPeriodCount) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.count > 0 ? item.count : ""}
                      </span>
                      <div
                        className={cn(
                          "w-full bg-primary rounded-t-lg transition-all duration-300",
                          "hover:bg-primary/80"
                        )}
                        style={{
                          height: `${Math.max(height, item.count > 0 ? 8 : 0)}%`,
                          minHeight: item.count > 0 ? "8px" : "2px",
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground text-center w-full truncate">
                        {formatPeriodLabel(item.period, period)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Summary */}
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground">
                    {byPeriod?.data?.reduce((sum: number, item: any) => sum + item.count, 0) ?? 0}
                  </span>
                  total
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground">
                    {Math.round(
                      (byPeriod?.data?.reduce((sum: number, item: any) => sum + item.count, 0) ?? 0) /
                        (byPeriod?.data?.length || 1)
                    )}
                  </span>
                  moyenne
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-state py-12">
              <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucune donnée disponible pour cette période</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de complétion</p>
                <p className="text-2xl font-bold">
                  {stats?.questionnaire_completion_rate
                    ? `${Math.round(stats.questionnaire_completion_rate)}%`
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-muted-foreground mb-3">Zones populaires</p>
            {(byZone?.data?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-2">
                {byZone?.data?.slice(0, 4).map((zone: any, index: number) => (
                  <Badge
                    key={zone.zone_id}
                    variant={index === 0 ? "default" : "secondary"}
                  >
                    {zone.zone_nom}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Top praticien</p>
                {byPraticien?.data?.[0] ? (
                  <>
                    <p className="font-bold truncate">
                      {byPraticien?.data?.[0]?.praticien_nom}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {byPraticien?.data?.[0]?.count} séances
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune donnée</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatPeriodLabel(dateStr: string, period: string): string {
  const date = new Date(dateStr);
  switch (period) {
    case "week":
      return date.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2);
    case "month":
      return date.getDate().toString();
    case "quarter":
      return date.toLocaleDateString("fr-FR", { month: "short" }).slice(0, 3);
    case "year":
      return date.toLocaleDateString("fr-FR", { month: "short" }).slice(0, 3);
    default:
      return dateStr;
  }
}
