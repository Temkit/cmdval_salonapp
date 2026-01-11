"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, User, ChevronLeft, ChevronRight, X, Scan, Phone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnnouncer } from "@/components/ui/live-region";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { announce, Announcer } = useAnnouncer();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["patients", page, debouncedSearch],
    queryFn: () => api.getPatients({ page, size: pageSize, q: debouncedSearch || undefined }),
  });

  // Announce results to screen readers
  useEffect(() => {
    if (!isLoading && data) {
      if (debouncedSearch) {
        announce(
          `${data.total || 0} résultat${(data.total || 0) > 1 ? "s" : ""} pour "${debouncedSearch}"`
        );
      } else {
        announce(`${data.total || 0} patient${(data.total || 0) > 1 ? "s" : ""} trouvés`);
      }
    }
  }, [data, isLoading, debouncedSearch, announce]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Screen reader announcements */}
      <Announcer mode="polite" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Patients</h1>
          <p className="text-sm text-muted-foreground mt-1" aria-live="polite">
            {data?.total ? `${data.total} patient${data.total > 1 ? "s" : ""}` : "Gerez vos patients"}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/patients/nouveau">
            <Plus className="h-5 w-5 mr-2" />
            Nouveau patient
          </Link>
        </Button>
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
            <Button variant="outline" size="icon" className="shrink-0">
              <Scan className="h-5 w-5" />
              <span className="sr-only">Scanner une carte</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Chargement des patients">
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
          {data.patients.map((patient: any) => (
            <Card key={patient.id} interactive>
              <Link href={`/patients/${patient.id}`}>
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
                        <Badge variant="secondary">
                          {patient.age} ans
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(patient.created_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
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
                      onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
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
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-lg">Aucun patient trouve</p>
              {search ? (
                <>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aucun resultat pour "{search}"
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearch("")}
                    className="mt-4"
                  >
                    Effacer la recherche
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mt-1">
                    Commencez par ajouter votre premier patient
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/patients/nouveau">
                      <Plus className="h-5 w-5 mr-2" />
                      Nouveau patient
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
