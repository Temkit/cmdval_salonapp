import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, ChevronRight, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/practitioner/mes-patients")({
  component: MesPatientsPage,
});

function MesPatientsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-patients", user?.id, debouncedSearch, page],
    queryFn: () =>
      api.getPatients({
        doctor_id: user?.id,
        q: debouncedSearch || undefined,
        page,
        size: 20,
      }),
    enabled: !!user?.id,
  });

  const patients = data?.patients || [];
  const totalPages = data?.pages || 1;

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div>
        <h1 className="heading-2">Mes patients</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Patients que vous avez traites
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, prenom ou code carte..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Results */}
      {isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message || "Impossible de charger les patients"}
            </p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
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
                  <div className="h-10 w-10 skeleton rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-40 skeleton rounded" />
                    <div className="h-4 w-24 skeleton rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : patients.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} patient{(data?.total || 0) > 1 ? "s" : ""} trouve{(data?.total || 0) > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {patients.map((p) => (
              <Link
                key={p.id}
                to="/practitioner/seance/$patientId"
                params={{ patientId: p.id }}
                className="block"
              >
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {p.prenom} {p.nom}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {p.code_carte}
                          </span>
                          {p.telephone && (
                            <span className="text-xs text-muted-foreground">
                              {p.telephone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.phototype && (
                          <Badge variant="outline" size="sm">
                            {p.phototype}
                          </Badge>
                        )}
                        <Badge
                          variant={p.status === "actif" ? "default" : "secondary"}
                          size="sm"
                        >
                          {p.status === "actif"
                            ? "Actif"
                            : p.status === "ineligible"
                              ? "Ineligible"
                              : "En attente"}
                        </Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Precedent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={User}
          title={search ? "Aucun resultat" : "Aucun patient"}
          description={
            search
              ? "Aucun patient ne correspond a votre recherche"
              : "Vous n'avez pas encore traite de patients"
          }
        />
      )}
    </div>
  );
}
