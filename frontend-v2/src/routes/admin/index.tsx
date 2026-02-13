import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  BarChart3,
  Users,
  Zap,
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
  DollarSign,
  MapPin,
  Download,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

const PERIOD_OPTIONS = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Annee" },
] as const;

function AdminDashboardPage() {
  const [sessionPeriod, setSessionPeriod] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const hasDateFilter = dateFrom || dateTo;

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const response = await fetch(`/api/v1/dashboard/export?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export echoue");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-seances-${dateFrom || "debut"}-${dateTo || "fin"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail - user sees button state reset
    } finally {
      setExporting(false);
    }
  }, [dateFrom, dateTo]);

  const clearFilters = useCallback(() => {
    setDateFrom("");
    setDateTo("");
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.getDashboardStats(),
  });

  const { data: revenueData } = useQuery({
    queryKey: ["dashboard-revenue", dateFrom, dateTo],
    queryFn: () =>
      api.getDashboardRevenue({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  });

  const { data: activityData } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: () => api.getRecentActivity(10),
  });

  const { data: zoneData } = useQuery({
    queryKey: ["sessions-by-zone"],
    queryFn: () => api.getSessionsByZone(),
  });

  const { data: praticienData } = useQuery({
    queryKey: ["sessions-by-praticien"],
    queryFn: () => api.getSessionsByPraticien(),
  });

  const { data: performanceData } = useQuery({
    queryKey: ["doctor-performance"],
    queryFn: () => api.getDoctorPerformance(),
  });

  const { data: periodData } = useQuery({
    queryKey: ["sessions-by-period", sessionPeriod],
    queryFn: () => api.getSessionsByPeriod(sessionPeriod),
  });

  const { data: sideEffectData } = useQuery({
    queryKey: ["side-effect-stats"],
    queryFn: () => api.getSideEffectStats(),
  });

  const { data: demographicsData } = useQuery({
    queryKey: ["demographics"],
    queryFn: () => api.getDemographics(),
  });

  const statCards = [
    {
      label: "Patients",
      value: stats?.total_patients ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Seances aujourd'hui",
      value: stats?.sessions_today ?? 0,
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Seances ce mois",
      value: stats?.sessions_month ?? 0,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Nouveaux patients",
      value: stats?.new_patients_this_month ?? 0,
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="heading-2">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue d'ensemble de l'activite
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={exporting}
          className="shrink-0"
        >
          <Download className="h-4 w-4 mr-1.5" />
          {exporting ? "Export..." : "Exporter CSV"}
        </Button>
      </div>

      {/* Date range filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground shrink-0">Du</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground shrink-0">Au</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            {hasDateFilter && (
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" />
                Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  {statsLoading ? (
                    <div className="h-7 w-16 skeleton rounded" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData ? (
              <div className="space-y-4">
                <p className="text-3xl font-bold">
                  {revenueData.total_revenue?.toLocaleString()} DA
                </p>
                <div className="space-y-2">
                  {revenueData.revenue_by_type?.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{item.type}</span>
                      <span className="font-medium">
                        {item.total?.toLocaleString()} DA ({item.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <div className="h-8 w-32 skeleton rounded" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Performance medecins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData?.doctors ? (
              <div className="space-y-3">
                {performanceData.doctors.map((doc) => (
                  <div
                    key={doc.doctor_id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{doc.doctor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.total_sessions} seances
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {doc.avg_duration_minutes?.toFixed(0)} min/seance
                      </p>
                      <Badge
                        variant={
                          doc.comparison_to_avg <= 0 ? "success" : "warning"
                        }
                        size="sm"
                      >
                        {doc.comparison_to_avg > 0 ? "+" : ""}
                        {doc.comparison_to_avg?.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-5 w-32 skeleton rounded" />
                    <div className="h-5 w-20 skeleton rounded" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top zones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Zones les plus traitees
            </CardTitle>
          </CardHeader>
          <CardContent>
            {zoneData?.data ? (
              <div className="space-y-3">
                {zoneData.data.slice(0, 8).map((zone) => {
                  const max = zoneData.data[0]?.count ?? 1;
                  return (
                    <div key={zone.zone_id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{zone.zone_nom}</span>
                        <span className="font-medium">{zone.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(zone.count / max) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-4 w-full skeleton rounded" />
                    <div className="h-1.5 skeleton rounded-full" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions by practitioner */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Seances par praticien
            </CardTitle>
          </CardHeader>
          <CardContent>
            {praticienData?.data ? (
              <div className="space-y-3">
                {praticienData.data.map((p) => {
                  const max = praticienData.data[0]?.count ?? 1;
                  return (
                    <div key={p.praticien_id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{p.praticien_nom}</span>
                        <span className="font-medium">{p.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${(p.count / max) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-4 w-full skeleton rounded" />
                    <div className="h-1.5 skeleton rounded-full" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sessions by period */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Seances par periode
            </CardTitle>
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={sessionPeriod === opt.value ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setSessionPeriod(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {periodData?.data ? (
            periodData.data.length > 0 ? (
              <div className="space-y-2">
                {(() => {
                  const maxCount = Math.max(...periodData.data.map((d) => d.count), 1);
                  return periodData.data.map((item) => (
                    <div key={item.period} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 shrink-0 text-right">
                        {item.period}
                      </span>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-primary/80 rounded flex items-center justify-end pr-2"
                          style={{ width: `${Math.max((item.count / maxCount) * 100, 8)}%` }}
                        >
                          <span className="text-[10px] font-medium text-primary-foreground">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune donnee pour cette periode
              </p>
            )
          ) : (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-20 skeleton rounded" />
                  <div className="h-6 flex-1 skeleton rounded" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Side effects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Effets secondaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sideEffectData ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{sideEffectData.total}</p>
                  <span className="text-sm text-muted-foreground">signales</span>
                </div>
                {sideEffectData.by_severity?.length > 0 && (
                  <div className="space-y-2">
                    {sideEffectData.by_severity.map((item) => {
                      const severityColors: Record<string, string> = {
                        leger: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        modere: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                        severe: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      };
                      return (
                        <div key={item.severity} className="flex items-center justify-between">
                          <Badge
                            className={severityColors[item.severity] ?? "bg-muted text-muted-foreground"}
                          >
                            {item.severity}
                          </Badge>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {sideEffectData.trend?.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Tendance mensuelle</p>
                    <div className="flex items-end gap-1 h-16">
                      {(() => {
                        const maxTrend = Math.max(...sideEffectData.trend.map((t) => t.count), 1);
                        return sideEffectData.trend.slice(-6).map((t) => (
                          <div key={t.month} className="flex-1 flex flex-col items-center gap-0.5">
                            <div
                              className="w-full bg-primary/20 rounded-sm min-h-[2px]"
                              style={{ height: `${(t.count / maxTrend) * 100}%` }}
                            />
                            <span className="text-[9px] text-muted-foreground">{t.month.slice(-2)}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-8 w-16 skeleton rounded" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-5 w-20 skeleton rounded" />
                    <div className="h-5 w-8 skeleton rounded" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demographics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Demographiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            {demographicsData ? (
              <div className="space-y-5">
                {demographicsData.age_distribution?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      Distribution par age
                    </p>
                    <div className="space-y-1.5">
                      {(() => {
                        const maxAge = Math.max(...demographicsData.age_distribution.map((d) => d.count), 1);
                        return demographicsData.age_distribution.map((item) => (
                          <div key={item.range} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-14 shrink-0">{item.range}</span>
                            <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
                              <div
                                className="h-full bg-blue-500/70 rounded-sm"
                                style={{ width: `${(item.count / maxAge) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-8 text-right">{item.count}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
                {demographicsData.city_distribution?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      Distribution par ville
                    </p>
                    <div className="space-y-1.5">
                      {demographicsData.city_distribution.slice(0, 6).map((item) => (
                        <div key={item.city} className="flex items-center justify-between text-sm">
                          <span>{item.city || "Non renseigne"}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-12 skeleton rounded" />
                    <div className="h-4 flex-1 skeleton rounded" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activite recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityData?.activities ? (
            <div className="space-y-3">
              {activityData.activities.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p>{item.description}</p>
                    {item.patient_nom && (
                      <p className="text-xs text-muted-foreground">
                        {item.patient_nom}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(item.timestamp ?? item.date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-2 w-2 skeleton rounded-full mt-1.5" />
                  <div className="h-4 flex-1 skeleton rounded" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
