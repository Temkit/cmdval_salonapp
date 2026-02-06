import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/secretary/pre-consultations/")({
  component: SecretaryPreConsultationsPage,
});

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "muted" | "info" | "warning" | "success" | "destructive";
    icon: typeof CheckCircle;
  }
> = {
  draft: { label: "Brouillon", variant: "muted", icon: FileText },
  pending_validation: {
    label: "En attente",
    variant: "warning",
    icon: Clock,
  },
  validated: { label: "Validee", variant: "success", icon: CheckCircle },
  rejected: { label: "Rejetee", variant: "destructive", icon: AlertCircle },
};

function SecretaryPreConsultationsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const pageSize = 20;

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
        status: statusFilter || undefined,
      }),
  });

  const statusFilters = [
    { value: "", label: "Toutes" },
    { value: "draft", label: "Brouillons" },
    { value: "pending_validation", label: "En attente" },
    { value: "validated", label: "Validees" },
  ];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Pre-consultations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total
              ? `${data.total} pre-consultation${data.total > 1 ? "s" : ""}`
              : "Gerez les pre-consultations"}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/secretary/pre-consultations/nouveau">
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle pre-consultation
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Rechercher par nom..."
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
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message ||
                "Impossible de charger les pre-consultations"}
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-4"
            >
              Reessayer
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl skeleton shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-36 skeleton rounded" />
                    <div className="h-4 w-24 skeleton rounded" />
                  </div>
                  <div className="h-6 w-20 skeleton rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.items?.length ? (
        <div className="space-y-3">
          {data.items.map((pc) => {
            const status = statusConfig[pc.status] ?? { label: "Brouillon", variant: "muted" as const, icon: FileText };
            const StatusIcon = status.icon;
            return (
              <Link
                key={pc.id}
                to={"/secretary/pre-consultations/$id" as string}
                params={{ id: pc.id }}
              >
              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <StatusIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {pc.patient_prenom} {pc.patient_nom}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pc.sexe && `${pc.sexe}`}
                        {pc.age && ` - ${pc.age} ans`}
                        {pc.phototype && ` - Phototype ${pc.phototype}`}
                        {pc.zones_count !== undefined &&
                          ` - ${pc.zones_count} zone${pc.zones_count > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant={status.variant} dot>
                        {status.label}
                      </Badge>
                      {pc.updated_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(pc.updated_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
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
                      onClick={() =>
                        setPage((p) => Math.min(data.total_pages, p + 1))
                      }
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
      ) : (
        <EmptyState
          icon={FileText}
          title="Aucune pre-consultation"
          description={
            search
              ? `Aucun resultat pour "${search}"`
              : "Les pre-consultations apparaitront ici"
          }
          action={
            search
              ? { label: "Effacer la recherche", onClick: () => setSearch("") }
              : undefined
          }
        />
      )}
    </div>
  );
}
