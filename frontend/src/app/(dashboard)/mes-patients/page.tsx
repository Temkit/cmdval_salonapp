"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Stethoscope,
  Phone,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Calendar,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function MesPatientsPage() {
  const user = useAuthStore((s) => s.user);
  const doctorId = user?.id || "";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [patientPage, setPatientPage] = useState(1);
  const [sessionPage, setSessionPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPatientPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ["doctor-patients", doctorId, patientPage, debouncedSearch],
    queryFn: () =>
      api.getDoctorPatients(doctorId, {
        page: patientPage,
        size: pageSize,
        q: debouncedSearch || undefined,
      }),
    enabled: !!doctorId,
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["doctor-sessions", doctorId, sessionPage],
    queryFn: () =>
      api.getDoctorSessions(doctorId, { page: sessionPage, size: pageSize }),
    enabled: !!doctorId,
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-2 flex items-center gap-2">
          <Stethoscope className="h-6 w-6" />
          Mes patients
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Patients traites et historique de seances
        </p>
      </div>

      <Tabs defaultValue="patients">
        <TabsList>
          <TabsTrigger value="patients">
            <User className="h-4 w-4 mr-1.5" />
            Patients ({patientsData?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Zap className="h-4 w-4 mr-1.5" />
            Seances ({sessionsData?.total || 0})
          </TabsTrigger>
        </TabsList>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4 mt-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Rechercher par nom, telephone..."
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
            </CardContent>
          </Card>

          {patientsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl skeleton shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-36 skeleton rounded" />
                        <div className="h-4 w-24 skeleton rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : patientsData?.patients?.length ? (
            <div className="space-y-3">
              {patientsData.patients.map((patient: any) => (
                <Card key={patient.id} interactive>
                  <Link href={`/patients/${patient.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-lg font-semibold text-primary">
                            {patient.prenom?.[0]}
                            {patient.nom?.[0]}
                          </span>
                        </div>
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
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {patient.age && (
                            <Badge variant="secondary">{patient.age} ans</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}

              {/* Pagination */}
              {patientsData.pages > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {patientPage} sur {patientsData.pages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPatientPage((p) => Math.max(1, p - 1))}
                          disabled={patientPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Precedent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPatientPage((p) => Math.min(patientsData.pages, p + 1))
                          }
                          disabled={patientPage === patientsData.pages}
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
              title="Aucun patient"
              description={
                search
                  ? `Aucun resultat pour "${search}"`
                  : "Vous n'avez pas encore traite de patients"
              }
              action={
                search
                  ? { label: "Effacer la recherche", onClick: () => setSearch("") }
                  : undefined
              }
            />
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4 mt-4">
          {sessionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl skeleton shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-48 skeleton rounded" />
                        <div className="h-4 w-32 skeleton rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sessionsData?.sessions?.length ? (
            <div className="space-y-3">
              {sessionsData.sessions.map((session: any) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Zap className="h-5 w-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/patients/${session.patient_id}`}
                          className="font-semibold hover:underline truncate block"
                        >
                          {session.zone_nom}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(session.date_seance)}
                          </span>
                          {session.type_laser && ` • ${session.type_laser}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="secondary">{session.zone_nom}</Badge>
                        {session.duree_minutes && (
                          <span className="text-xs text-muted-foreground">
                            {session.duree_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {sessionsData.pages > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {sessionPage} sur {sessionsData.pages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                          disabled={sessionPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Precedent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSessionPage((p) => Math.min(sessionsData.pages, p + 1))
                          }
                          disabled={sessionPage === sessionsData.pages}
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
              icon={Zap}
              title="Aucune seance"
              description="Vous n'avez pas encore effectue de seances"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
