import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  CreditCard,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/admin/patients/")({
  component: AdminPatientsPage,
});

function AdminPatientsPage() {
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      const response = await fetch(`/api/v1/patients/export?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export echoue");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "patients_export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["patients", page, debouncedSearch],
    queryFn: () =>
      api.getPatients({
        page,
        size: pageSize,
        q: debouncedSearch || undefined,
      }),
  });

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total
              ? `${data.total} patient${data.total > 1 ? "s" : ""}`
              : "Gerez vos patients"}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-1.5" />
            {exporting ? "Export..." : "Exporter CSV"}
          </Button>
          {hasPermission("patients.create") && (
            <Button asChild className="flex-1 sm:flex-initial">
              <Link to="/admin/patients/nouveau">
                <Plus className="h-5 w-5 mr-2" />
                Nouveau patient
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Rechercher par nom, telephone ou code..."
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
                "Impossible de charger les patients"}
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
      ) : data?.patients?.length ? (
        <div className="space-y-3">
          {data.patients.map((patient) => (
            <Link
              key={patient.id}
              to={"/admin/patients/$id" as string}
              params={{ id: patient.id }}
            >
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-lg font-semibold text-primary">
                        {patient.prenom?.[0]}
                        {patient.nom?.[0]}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {patient.prenom} {patient.nom}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {patient.code_carte && (
                          <span className="inline-flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {patient.code_carte}
                          </span>
                        )}
                        {patient.code_carte && patient.telephone && " • "}
                        {patient.telephone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.telephone}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {patient.age && (
                        <Badge variant="secondary">{patient.age} ans</Badge>
                      )}
                      {patient.created_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(patient.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Pagination */}
          {data.pages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page} sur {data.pages}
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
                        setPage((p) => Math.min(data.pages, p + 1))
                      }
                      disabled={page === data.pages}
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
          icon={User}
          title="Aucun patient trouve"
          description={
            search
              ? `Aucun resultat pour "${search}"`
              : "Commencez par ajouter votre premier patient"
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
