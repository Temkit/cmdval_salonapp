"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Phone,
  Target,
  History,
  CreditCard,
  Zap,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { AddZoneDialog } from "@/components/features/patients/add-zone-dialog";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(id),
  });

  const { data: sessions } = useQuery({
    queryKey: ["patient-sessions", id],
    queryFn: () => api.getPatientSessions(id, { page: 1, size: 5 }),
  });

  const handleStartSession = () => {
    haptics.heavy();
    router.push(`/patients/${id}/seance`);
  };

  const handleCall = () => {
    if (patient?.telephone) {
      haptics.medium();
      window.location.href = `tel:${patient.telephone}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="sticky top-0 z-40 bg-background border-b px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <div className="h-10 w-10 skeleton rounded-xl" />
            <div className="h-6 w-32 skeleton" />
          </div>
        </div>
        <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-48 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-xl font-semibold">Patient non trouvé</p>
        <p className="text-muted-foreground text-center mt-1 mb-6">
          Ce patient n'existe pas ou a été supprimé
        </p>
        <Button asChild size="lg">
          <Link href="/patients">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const totalZones = patient.zones?.length || 0;
  const completedZones = patient.zones?.filter((z: any) => z.progression >= 1).length || 0;

  return (
    <div className="min-h-screen flex flex-col pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/patients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="font-semibold">Dossier patient</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
        {/* Patient Identity Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-primary">
                    {patient.prenom?.[0]}{patient.nom?.[0]}
                  </span>
                </div>

                {/* Name & Card */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold truncate">
                    {patient.prenom} {patient.nom}
                  </h1>
                  {patient.code_carte && (
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm font-medium">{patient.code_carte}</span>
                    </div>
                  )}
                </div>

                {/* Quick Call */}
                {patient.telephone && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-12 w-12 rounded-xl"
                    onClick={handleCall}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 divide-x border-t">
              <div className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{totalZones}</p>
                <p className="text-xs text-muted-foreground">Zones</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {sessions?.total || 0}
                </p>
                <p className="text-xs text-muted-foreground">Séances</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{completedZones}</p>
                <p className="text-xs text-muted-foreground">Terminées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zones Progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Zones de traitement</h2>
            <AddZoneDialog patientId={id} existingZones={patient.zones || []} />
          </div>

          {patient.zones?.length > 0 ? (
            <div className="space-y-3">
              {patient.zones.map((zone: any) => (
                <Card key={zone.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{zone.zone_nom}</p>
                          <span className="text-sm font-semibold text-primary">
                            {Math.round(zone.progression * 100)}%
                          </span>
                        </div>
                        <Progress value={zone.progression * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {zone.seances_effectuees} / {zone.seances_prevues} séances
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Aucune zone</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ajoutez des zones pour suivre les traitements
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Sessions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Dernières séances</h2>
            {sessions?.total > 5 && (
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Voir tout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {sessions?.sessions?.length > 0 ? (
            <div className="space-y-2">
              {sessions.sessions.map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{session.zone_nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.praticien_nom}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {formatDate(session.date_seance)}
                    </p>
                    {session.duree_minutes && (
                      <p className="text-xs text-muted-foreground">
                        {session.duree_minutes} min
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Aucune séance</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Commencez le premier traitement
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Action - THUMB ZONE */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <Button
            size="lg"
            className="w-full h-16 text-lg font-semibold rounded-2xl"
            onClick={handleStartSession}
          >
            <Zap className="h-6 w-6 mr-3" />
            Démarrer une séance
          </Button>
        </div>
      </div>
    </div>
  );
}
