"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  Users,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Award,
  PieChart,
  DollarSign,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  UserCircle,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  ZoneStatsItem,
  PraticienStatsItem,
  PeriodDataItem,
  SideEffectStatsResponse,
  DoctorPerformanceItem,
  DoctorPerformanceResponse,
  RevenueBreakdown,
  DemographicsResponse,
} from "@/types";

interface LostTimeItem {
  doctor_id?: string;
  doctor_name?: string;
  type_laser?: string;
  total_expected_minutes: number;
  total_actual_minutes: number;
  lost_minutes: number;
  session_count: number;
}

interface LostTimeStats {
  by_doctor: LostTimeItem[];
  by_laser: LostTimeItem[];
}

const periodOptions = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("month");

  const { data: stats, isLoading: statsLoading, isError, error, refetch } = useQuery({
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

  const { data: sideEffectData } = useQuery({
    queryKey: ["side-effect-stats"],
    queryFn: () => api.getSideEffectStats(),
  });

  const { data: doctorData } = useQuery({
    queryKey: ["doctor-performance"],
    queryFn: () => api.getDoctorPerformance(),
  });

  const { data: revenueData } = useQuery({
    queryKey: ["dashboard-revenue"],
    queryFn: () => api.getDashboardRevenue(),
  });

  const { data: demographicsData } = useQuery({
    queryKey: ["demographics"],
    queryFn: () => api.getDemographics(),
  });

  const { data: lostTimeData } = useQuery({
    queryKey: ["lost-time-stats"],
    queryFn: () => api.getLostTimeStats(),
  });

  // Calculate max values for charts
  const maxZoneCount = Math.max(...(byZone?.data?.map((z: ZoneStatsItem) => z.count) || [1]));
  const maxPraticienCount = Math.max(...(byPraticien?.data?.map((p: PraticienStatsItem) => p.count) || [1]));
  const maxPeriodCount = Math.max(...(byPeriod?.data?.map((p: PeriodDataItem) => p.count) || [1]));

  if (isError) {
    return (
      <Card><CardContent className="py-12 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
        <p className="font-medium">Erreur de chargement</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : "Impossible de charger les donnees"}
        </p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          Reessayer
        </Button>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Analytiques</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Statistiques et performances du centre
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = api.getDashboardExportUrl();
              window.open(url, "_blank");
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <ButtonGroup
            options={periodOptions}
            value={period}
            onChange={setPeriod}
            size="sm"
            columns={4}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={statsLoading ? <div className="h-8 w-20 skeleton rounded" /> : stats?.total_patients || 0}
          description="Patients enregistrés"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Total Séances"
          value={statsLoading ? <div className="h-8 w-20 skeleton rounded" /> : stats?.total_sessions || 0}
          description="Séances effectuées"
          icon={<Zap className="h-5 w-5" />}
        />
        <StatCard
          title="Séances aujourd'hui"
          value={statsLoading ? <div className="h-8 w-20 skeleton rounded" /> : stats?.sessions_today || 0}
          description="Traitements du jour"
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          title="Séances ce mois"
          value={statsLoading ? <div className="h-8 w-20 skeleton rounded" /> : stats?.sessions_this_month || 0}
          description="Ce mois-ci"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Quick Stats - Moved to top */}
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
                {byZone?.data?.slice(0, 4).map((zone: ZoneStatsItem, index: number) => (
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

      {/* Sessions over Time - Bar Chart */}
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
              {/* Bar chart with Y-axis */}
              <div className="flex gap-2">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between text-xs text-muted-foreground pr-2 py-1" style={{ height: "160px" }}>
                  <span>{maxPeriodCount}</span>
                  <span>{Math.round(maxPeriodCount / 2)}</span>
                  <span>0</span>
                </div>
                {/* Bars */}
                <div className="flex-1 flex items-end gap-1 sm:gap-2 border-l border-b border-border pl-2" style={{ height: "160px" }}>
                  {byPeriod?.data?.slice(-12).map((item: PeriodDataItem, index: number) => {
                    const heightPercent = maxPeriodCount > 0 ? (item.count / maxPeriodCount) * 100 : 0;
                    const barHeight = Math.max(heightPercent, item.count > 0 ? 8 : 2);
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center h-full"
                      >
                        {/* Bar container - takes remaining space */}
                        <div className="flex-1 w-full flex items-end">
                          <div
                            className={cn(
                              "w-full bg-primary rounded-t-lg transition-all duration-300",
                              "hover:bg-primary/80 relative group"
                            )}
                            style={{
                              height: `${barHeight}%`,
                            }}
                          >
                            {/* Tooltip on hover */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.count} séance{item.count > 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                        {/* Date label */}
                        <span className="text-[10px] text-muted-foreground text-center w-full truncate mt-1">
                          {formatPeriodLabel(item.period, period)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* X-axis label */}
              <div className="text-center text-xs text-muted-foreground">
                {period === "week" ? "Jours" : period === "month" ? "Jours du mois" : period === "quarter" ? "Semaines" : "Mois"}
              </div>
              {/* Summary */}
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground">
                    {byPeriod?.data?.reduce((sum: number, item: PeriodDataItem) => sum + item.count, 0) ?? 0}
                  </span>
                  total
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground">
                    {Math.round(
                      (byPeriod?.data?.reduce((sum: number, item: PeriodDataItem) => sum + item.count, 0) ?? 0) /
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
                {byZone?.data?.map((zone: ZoneStatsItem) => (
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
                {byPraticien?.data?.map((praticien: PraticienStatsItem, index: number) => (
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

      {/* Side Effects Summary */}
      {sideEffectData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Effets secondaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(() => {
                const se = sideEffectData;
                const getSeverityCount = (severity: string) =>
                  se?.by_severity?.find((s) => s.severity === severity)?.count || 0;
                return (
                  <>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold">{se?.total || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total signales</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold text-yellow-600">{getSeverityCount("mild")}</p>
                      <p className="text-xs text-muted-foreground mt-1">Legers</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold text-orange-600">{getSeverityCount("moderate")}</p>
                      <p className="text-xs text-muted-foreground mt-1">Moderes</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold text-destructive">{getSeverityCount("severe")}</p>
                      <p className="text-xs text-muted-foreground mt-1">Severes</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hors Carte Profitability */}
      {revenueData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-primary" />
              Rentabilite par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const rev = revenueData;
              const packRev = rev.pack_revenue || 0;
              const hcRev = rev.hors_carte_revenue || 0;
              const total = packRev + hcRev;
              const packPct = total > 0 ? Math.round((packRev / total) * 100) : 0;
              const hcPct = total > 0 ? 100 - packPct : 0;
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">Pack / Carte</p>
                      <p className="text-2xl font-bold">{packRev.toLocaleString()} DA</p>
                      <p className="text-xs text-muted-foreground mt-1">{rev.pack_count || 0} paiements</p>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                      <p className="text-sm text-muted-foreground">Hors carte</p>
                      <p className="text-2xl font-bold">{hcRev.toLocaleString()} DA</p>
                      <p className="text-xs text-muted-foreground mt-1">{rev.hors_carte_count || 0} paiements</p>
                    </div>
                  </div>
                  {total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Pack ({packPct}%)</span>
                        <span>Hors carte ({hcPct}%)</span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden">
                        <div className="bg-primary transition-all" style={{ width: `${packPct}%` }} />
                        <div className="bg-orange-500 transition-all" style={{ width: `${hcPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Doctor Performance with Flags */}
      {doctorData && doctorData.doctors?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Performance praticiens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {doctorData.doctors.map((doc: DoctorPerformanceItem) => {
                const statusConfig: Record<string, { label: string; className: string }> = {
                  normal: { label: "Normal", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
                  trop_lent: { label: "Trop lent", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
                  trop_rapide: { label: "Trop rapide", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
                };
                const status = statusConfig[doc.status] || statusConfig.normal;
                return (
                  <div key={doc.doctor_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{doc.doctor_name}</p>
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", status.className)}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.total_sessions} seances</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-medium">{doc.avg_duration_minutes ? `${Math.round(doc.avg_duration_minutes)} min` : "-"}</p>
                      {doc.expected_avg_duration > 0 && (
                        <p className="text-xs text-muted-foreground">
                          attendu: {Math.round(doc.expected_avg_duration)} min
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lost Time */}
      {lostTimeData && (lostTimeData.by_doctor?.length > 0 || lostTimeData.by_laser?.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* By Doctor */}
          {lostTimeData.by_doctor?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Timer className="h-5 w-5 text-primary" />
                  Temps perdu par praticien
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lostTimeData.by_doctor.map((item: LostTimeItem) => (
                    <div key={item.doctor_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.doctor_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.session_count} seances • Attendu: {Math.round(item.total_expected_minutes)} min • Reel: {Math.round(item.total_actual_minutes)} min
                        </p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 font-semibold shrink-0 ml-2",
                        item.lost_minutes > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {item.lost_minutes > 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {Math.abs(Math.round(item.lost_minutes))} min
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* By Laser */}
          {lostTimeData.by_laser?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-5 w-5 text-primary" />
                  Temps perdu par laser
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lostTimeData.by_laser.map((item: LostTimeItem) => (
                    <div key={item.type_laser} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.type_laser}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.session_count} seances • Attendu: {Math.round(item.total_expected_minutes)} min • Reel: {Math.round(item.total_actual_minutes)} min
                        </p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 font-semibold shrink-0 ml-2",
                        item.lost_minutes > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {item.lost_minutes > 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {Math.abs(Math.round(item.lost_minutes))} min
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {/* Demographics */}
      {demographicsData && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Age Distribution */}
          {(demographicsData as DemographicsResponse).age_distribution?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCircle className="h-5 w-5 text-primary" />
                  Repartition par age
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const ageData = (demographicsData as DemographicsResponse).age_distribution;
                  const maxCount = Math.max(...ageData.map((a) => a.count), 1);
                  return (
                    <div className="space-y-3">
                      {ageData.map((item) => (
                        <div key={item.range} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.range}</span>
                            <span className="text-muted-foreground">{item.count}</span>
                          </div>
                          <Progress value={(item.count / maxCount) * 100} className="h-2.5" />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* City Distribution */}
          {(demographicsData as DemographicsResponse).city_distribution?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-primary" />
                  Repartition par ville
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const cityData = (demographicsData as DemographicsResponse).city_distribution;
                  const maxCount = Math.max(...cityData.map((c) => c.count), 1);
                  return (
                    <div className="space-y-3">
                      {cityData.slice(0, 10).map((item, index) => (
                        <div key={item.city} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-5 text-right">{index + 1}.</span>
                              <span className="font-medium">{item.city || "Non renseigne"}</span>
                            </div>
                            <span className="text-muted-foreground">{item.count}</span>
                          </div>
                          <Progress value={(item.count / maxCount) * 100} className="h-2.5" />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      )}
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
