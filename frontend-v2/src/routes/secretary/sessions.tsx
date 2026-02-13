import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Calendar, Clock, Stethoscope } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/secretary/sessions")({
  component: SecretarySessionsPage,
});

function SecretarySessionsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["sessions", page],
    queryFn: () => api.getSessions({ page, size: 20 }),
  });

  const sessions = data?.sessions || [];
  const totalPages = data?.pages || 0;

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div>
        <h1 className="heading-2">Seances</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.total !== undefined && `${data.total} seance(s) au total`}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique des seances</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  <div className="h-5 w-14 skeleton rounded" />
                  <div className="h-5 w-32 skeleton rounded" />
                  <div className="h-5 w-24 skeleton rounded" />
                  <div className="flex-1" />
                  <div className="h-6 w-20 skeleton rounded-full" />
                </div>
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  to="/secretary/patients/$id"
                  params={{ id: session.patient_id }}
                  className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {session.zone_nom || "Zone"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {session.date_seance && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.date_seance)}
                        </span>
                      )}
                      {session.praticien_nom && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Stethoscope className="h-3 w-3" />
                          Dr. {session.praticien_nom}
                        </span>
                      )}
                      {session.duree_minutes && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {session.duree_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  {session.type_laser && (
                    <Badge variant="outline">{session.type_laser}</Badge>
                  )}
                </Link>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
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
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="Aucune seance"
              description="Aucune seance enregistree pour le moment"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
