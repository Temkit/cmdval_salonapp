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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

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

  const isLoading = statsLoading || zoneLoading || praticienLoading || periodLoading;

  // Calculate max values for charts
  const maxZoneCount = Math.max(
    ...(byZone?.data?.map((z: any) => z.count) || [1])
  );
  const maxPraticienCount = Math.max(
    ...(byPraticien?.data?.map((p: any) => p.count) || [1])
  );
  const maxPeriodCount = Math.max(
    ...(byPeriod?.data?.map((p: any) => p.count) || [1])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytiques</h1>
          <p className="text-muted-foreground">
            Statistiques et performances du centre
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.total_patients || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Patients enregistrés
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Séances
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.total_sessions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Séances effectuées
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Séances aujourd'hui
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.sessions_today || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Traitements du jour
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Séances ce mois
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.sessions_month || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ce mois-ci
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions by Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Séances par zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            {zoneLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (byZone?.data?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {byZone?.data?.map((zone: any) => (
                  <div key={zone.zone_id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{zone.zone_nom}</span>
                      <span className="text-muted-foreground">
                        {zone.count} séances
                      </span>
                    </div>
                    <Progress
                      value={(zone.count / maxZoneCount) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions by Praticien */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Séances par praticien
            </CardTitle>
          </CardHeader>
          <CardContent>
            {praticienLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (byPraticien?.data?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {byPraticien?.data?.map((praticien: any) => (
                  <div key={praticien.praticien_id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {praticien.praticien_nom}
                      </span>
                      <span className="text-muted-foreground">
                        {praticien.count} séances
                      </span>
                    </div>
                    <Progress
                      value={(praticien.count / maxPraticienCount) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sessions over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Évolution des séances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {periodLoading ? (
            <div className="h-64 bg-muted animate-pulse rounded" />
          ) : (byPeriod?.data?.length ?? 0) > 0 ? (
            <div className="space-y-4">
              {/* Simple bar chart representation */}
              <div className="flex items-end justify-between h-48 gap-2">
                {byPeriod?.data?.slice(-12).map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-full bg-primary rounded-t transition-all"
                      style={{
                        height: `${(item.count / maxPeriodCount) * 100}%`,
                        minHeight: item.count > 0 ? "8px" : "0",
                      }}
                    />
                    <span className="text-xs text-muted-foreground truncate w-full text-center">
                      {formatPeriodLabel(item.period, period)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>
                  Total: {byPeriod?.data?.reduce((sum: number, item: any) => sum + item.count, 0) ?? 0} séances
                </span>
                <span>
                  Moyenne: {Math.round((byPeriod?.data?.reduce((sum: number, item: any) => sum + item.count, 0) ?? 0) / (byPeriod?.data?.length || 1))} / période
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée disponible pour cette période
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taux de complétion</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <div className="space-y-2">
                <div className="text-3xl font-bold">
                  {stats?.questionnaire_completion_rate
                    ? `${Math.round(stats.questionnaire_completion_rate)}%`
                    : "N/A"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Questionnaires complétés
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zones les plus traitées</CardTitle>
          </CardHeader>
          <CardContent>
            {zoneLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (byZone?.data?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-2">
                {byZone?.data?.slice(0, 5).map((zone: any, index: number) => (
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
          <CardHeader>
            <CardTitle className="text-base">Meilleur praticien</CardTitle>
          </CardHeader>
          <CardContent>
            {praticienLoading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : byPraticien?.data?.[0] ? (
              <div className="space-y-2">
                <div className="text-xl font-bold">
                  {byPraticien?.data?.[0]?.praticien_nom}
                </div>
                <p className="text-sm text-muted-foreground">
                  {byPraticien?.data?.[0]?.count} séances réalisées
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            )}
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
      return date.toLocaleDateString("fr-FR", { weekday: "short" });
    case "month":
      return date.toLocaleDateString("fr-FR", { day: "numeric" });
    case "quarter":
      return date.toLocaleDateString("fr-FR", { month: "short" });
    case "year":
      return date.toLocaleDateString("fr-FR", { month: "short" });
    default:
      return dateStr;
  }
}
