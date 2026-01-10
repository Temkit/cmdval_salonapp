"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, User, ChevronLeft, ChevronRight, X, Phone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

export default function PatientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

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

  const handlePatientClick = (patientId: string) => {
    haptics.selection();
    router.push(`/patients/${patientId}`);
  };

  const handleNewPatient = () => {
    haptics.medium();
    router.push("/patients/nouveau");
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b px-4 py-4 safe-area-top">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Patients</h1>
            <span className="text-sm text-muted-foreground">
              {data?.total || 0} patient{(data?.total || 0) !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors active:scale-95"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-card border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full skeleton shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-36 skeleton rounded" />
                    <div className="h-4 w-24 skeleton rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : data?.patients?.length ? (
          <div className="space-y-2">
            {data.patients.map((patient: any) => (
              <button
                key={patient.id}
                onClick={() => handlePatientClick(patient.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl bg-card border",
                  "hover:border-primary/30 active:scale-[0.98] transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-semibold text-primary">
                      {patient.prenom?.[0]}{patient.nom?.[0]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">
                      {patient.prenom} {patient.nom}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      {patient.code_carte && (
                        <span className="flex items-center gap-1 truncate">
                          <CreditCard className="h-3.5 w-3.5 shrink-0" />
                          {patient.code_carte}
                        </span>
                      )}
                      {patient.telephone && (
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {patient.telephone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  {patient.age && (
                    <Badge variant="secondary" className="shrink-0">
                      {patient.age} ans
                    </Badge>
                  )}
                </div>
              </button>
            ))}

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  {page} / {data.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-lg">
              {search ? "Aucun résultat" : "Aucun patient"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? `Aucun résultat pour "${search}"` : "Créez votre premier patient"}
            </p>
            {search && (
              <Button
                variant="outline"
                onClick={() => setSearch("")}
                className="mt-4"
              >
                Effacer la recherche
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Action - THUMB ZONE */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t p-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold rounded-xl"
            onClick={handleNewPatient}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouveau patient
          </Button>
        </div>
      </div>
    </div>
  );
}
