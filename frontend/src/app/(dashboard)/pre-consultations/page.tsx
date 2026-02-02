"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnnouncer } from "@/components/ui/live-region";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import type { PreConsultation } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: any }> = {
  draft: { label: "Brouillon", variant: "secondary", icon: ClipboardList },
  pending_validation: { label: "En attente", variant: "default", icon: Clock },
  validated: { label: "Validee", variant: "outline", icon: CheckCircle },
  rejected: { label: "Refusee", variant: "destructive", icon: XCircle },
};

export default function PreConsultationsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { announce, Announcer } = useAnnouncer();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["pre-consultations", page, debouncedSearch, statusFilter],
    queryFn: () =>
      api.getPreConsultations({
        page,
        size: pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter,
      }),
  });

  useEffect(() => {
    if (!isLoading && data) {
      announce(`${data.total || 0} pre-consultation${(data.total || 0) > 1 ? "s" : ""}`);
    }
  }, [data, isLoading, announce]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Announcer mode="polite" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Pre-consultations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total ? `${data.total} pre-consultation${data.total > 1 ? "s" : ""}` : "Evaluations d'eligibilite"}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/pre-consultations/nouveau">
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle pre-consultation
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === undefined ? "default" : "outline"}
                onClick={() => setStatusFilter(undefined)}
                size="sm"
              >
                Tous
              </Button>
              <Button
                variant={statusFilter === "pending_validation" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending_validation")}
                size="sm"
              >
                <Clock className="h-4 w-4 mr-1.5" />
                En attente
              </Button>
              <Button
                variant={statusFilter === "validated" ? "default" : "outline"}
                onClick={() => setStatusFilter("validated")}
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Validees
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {isError && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as any)?.message || "Impossible de charger les pre-consultations"}
            </p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Reessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl skeleton shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-5 w-36 skeleton rounded" />
                    <div className="h-4 w-24 skeleton rounded" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="h-5 w-20 skeleton rounded-full" />
                    <div className="h-3 w-16 skeleton rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.items?.length ? (
        <div className="space-y-3">
          {data.items.map((pc: PreConsultation) => {
            const statusConfig = STATUS_CONFIG[pc.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={pc.id} interactive>
                <Link href={`/pre-consultations/${pc.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                          pc.has_contraindications ? "bg-destructive/10" : "bg-primary/10"
                        )}
                      >
                        {pc.has_contraindications ? (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : (
                          <ClipboardList className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {pc.patient_prenom} {pc.patient_nom}
                          {pc.patient_code_carte && <span className="text-muted-foreground font-normal"> - {pc.patient_code_carte}</span>}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                          {pc.sexe === "F" ? "F" : "H"}, {pc.age} ans
                          {pc.phototype && ` • Phototype ${pc.phototype}`}
                          {` • ${(pc.zones_count ?? pc.zones?.length ?? 0)} zone${(pc.zones_count ?? pc.zones?.length ?? 0) !== 1 ? "s" : ""}`}
                        </p>
                      </div>

                      {/* Status & Date */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant={statusConfig.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(pc.created_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}

          {/* Pagination */}
          {data.total_pages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page} sur {data.total_pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Precedent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                      disabled={page === data.total_pages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : search ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={ClipboardList}
              title="Aucun resultat"
              description={`Aucun resultat pour "${search}"`}
              action={{ label: "Effacer la recherche", onClick: () => setSearch("") }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={ClipboardList}
              title="Aucune pre-consultation"
              description="Les pre-consultations permettent d'evaluer l'eligibilite des patients"
              action={{ label: "Nouvelle pre-consultation", href: "/pre-consultations/nouveau" }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
