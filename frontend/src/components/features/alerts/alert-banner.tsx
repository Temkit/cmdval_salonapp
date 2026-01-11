"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  patientId: string;
  className?: string;
}

export function AlertBanner({ patientId, className }: AlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["patient-alerts", patientId],
    queryFn: () => api.getPatientAlerts(patientId),
    staleTime: 60000, // 1 minute
  });

  if (isLoading || !data?.has_alerts) {
    return null;
  }

  const { alerts, has_errors, error_count, warning_count } = data;

  return (
    <div
      className={cn(
        "rounded-lg border",
        has_errors
          ? "bg-destructive/10 border-destructive/30"
          : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800",
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          {has_errors ? (
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
          )}
          <div>
            <p className={cn("font-medium", has_errors ? "text-destructive" : "text-yellow-800 dark:text-yellow-200")}>
              {has_errors ? "Contre-indications detectees" : "Attention requise"}
            </p>
            <div className="flex gap-2 mt-1">
              {error_count > 0 && (
                <Badge variant="destructive" size="sm">
                  {error_count} erreur{error_count > 1 ? "s" : ""}
                </Badge>
              )}
              {warning_count > 0 && (
                <Badge variant="secondary" size="sm" className="bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                  {warning_count} avertissement{warning_count > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {alerts.map((alert: any, index: number) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg",
                alert.severity === "error"
                  ? "bg-destructive/20 text-destructive"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
              )}
            >
              <div className="flex items-start gap-2">
                {alert.severity === "error" ? (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.zone_nom && (
                    <p className="text-xs opacity-80 mt-0.5">Zone: {alert.zone_nom}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AlertSummaryBadgeProps {
  patientId: string;
  className?: string;
}

export function AlertSummaryBadge({ patientId, className }: AlertSummaryBadgeProps) {
  const { data } = useQuery({
    queryKey: ["patient-alerts-summary", patientId],
    queryFn: () => api.getAlertsSummary(patientId),
    staleTime: 60000,
  });

  if (!data?.has_alerts) {
    return null;
  }

  const totalAlerts = data.error_count + data.warning_count;

  return (
    <Badge
      variant={data.has_errors ? "destructive" : "secondary"}
      className={cn(
        "gap-1",
        !data.has_errors && "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200",
        className
      )}
    >
      {data.has_errors ? (
        <AlertCircle className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      {totalAlerts}
    </Badge>
  );
}

interface ZoneAlertIndicatorProps {
  patientId: string;
  zoneId: string;
  className?: string;
}

export function ZoneAlertIndicator({ patientId, zoneId, className }: ZoneAlertIndicatorProps) {
  const { data } = useQuery({
    queryKey: ["zone-alerts", patientId, zoneId],
    queryFn: () => api.getZoneAlerts(patientId, zoneId),
    staleTime: 60000,
  });

  if (!data?.has_alerts) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {data.has_errors ? (
        <AlertCircle className="h-4 w-4 text-destructive" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      )}
    </div>
  );
}
