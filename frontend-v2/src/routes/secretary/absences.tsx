import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserX, AlertTriangle, Calendar, Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/secretary/absences")({
  component: SecretaryAbsencesPage,
});

function SecretaryAbsencesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["absences"],
    queryFn: () => api.getAbsences(),
  });

  const absences = data?.absences || [];

  const filtered = search
    ? absences.filter((a) =>
        a.patient_name.toLowerCase().includes(search.toLowerCase())
      )
    : absences;

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, a) => {
    const key = a.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div>
        <h1 className="heading-2">Absences</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.total !== undefined && `${data.total} absence(s) au total`}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message || "Impossible de charger les absences"}
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
      ) : filtered.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const entries = grouped[date] ?? [];
            return (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">{formatDate(date)}</h3>
                  <Badge variant="destructive" size="sm">{entries.length}</Badge>
                </div>
                <div className="space-y-2">
                  {entries.map((a) => {
                    const content = (
                      <Card className={a.patient_id ? "hover:bg-muted/50 transition-colors cursor-pointer" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                              <UserX className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {a.patient_name}
                              </p>
                              {a.doctor_name && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Dr. {a.doctor_name}
                                </p>
                              )}
                            </div>
                            <Badge variant="destructive">Absent</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                    return a.patient_id ? (
                      <Link key={a.id} to="/secretary/patients/$id" params={{ id: a.patient_id }} className="block">
                        {content}
                      </Link>
                    ) : (
                      <div key={a.id}>{content}</div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={UserX}
          title={search ? "Aucun resultat" : "Aucune absence"}
          description={
            search
              ? "Aucune absence ne correspond a votre recherche"
              : "Aucune absence enregistree"
          }
        />
      )}
    </div>
  );
}
