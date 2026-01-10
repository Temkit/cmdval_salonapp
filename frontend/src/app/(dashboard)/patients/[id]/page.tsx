"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  FileText,
  Target,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import { AddZoneDialog } from "@/components/features/patients/add-zone-dialog";
import { QuestionnaireTab } from "@/components/features/patients/questionnaire-tab";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(id),
  });

  const { data: sessions } = useQuery({
    queryKey: ["patient-sessions", id],
    queryFn: () => api.getPatientSessions(id, { page: 1, size: 10 }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient non trouvé</p>
        <Link href="/patients">
          <Button variant="link">Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {patient.prenom} {patient.nom}
              </h1>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>{patient.code_carte}</span>
                {patient.age && (
                  <>
                    <span>•</span>
                    <span>{patient.age} ans</span>
                  </>
                )}
                {patient.sexe && (
                  <>
                    <span>•</span>
                    <span>{patient.sexe === "F" ? "Femme" : "Homme"}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/patients/${id}/seance`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle séance
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="zones">
            <Target className="h-4 w-4 mr-2" />
            Zones
          </TabsTrigger>
          <TabsTrigger value="questionnaire">
            <FileText className="h-4 w-4 mr-2" />
            Questionnaire
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <History className="h-4 w-4 mr-2" />
            Séances
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Coordonnées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.telephone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.telephone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.adresse && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{patient.adresse}</span>
                  </div>
                )}
                {patient.date_naissance && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(patient.date_naissance)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations médicales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phototype</span>
                  <Badge variant="outline">{patient.phototype || "Non renseigné"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questionnaire</span>
                  <Badge variant={patient.questionnaire_complete ? "success" : "warning"}>
                    {patient.questionnaire_complete ? "Complet" : "Incomplet"}
                  </Badge>
                </div>
                {patient.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{patient.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Zones Progress */}
          {patient.zones?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Progression des zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.zones.map((zone: any) => (
                    <div key={zone.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{zone.zone_nom}</span>
                        <span className="text-muted-foreground">
                          {zone.seances_effectuees} / {zone.seances_prevues} séances
                        </span>
                      </div>
                      <Progress value={zone.progression * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Zones de traitement</CardTitle>
              <AddZoneDialog patientId={id} existingZones={patient.zones || []} />
            </CardHeader>
            <CardContent>
              {patient.zones?.length > 0 ? (
                <div className="space-y-4">
                  {patient.zones.map((zone: any) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{zone.zone_nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {zone.seances_effectuees} séances effectuées sur{" "}
                          {zone.seances_prevues} prévues
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {Math.round(zone.progression * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {zone.seances_restantes} restante{zone.seances_restantes > 1 ? "s" : ""}
                          </p>
                        </div>
                        <Progress
                          value={zone.progression * 100}
                          className="w-24 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Aucune zone de traitement configurée
                  </p>
                  <AddZoneDialog patientId={id} existingZones={[]} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questionnaire Tab */}
        <TabsContent value="questionnaire">
          <QuestionnaireTab patientId={id} />
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historique des séances</CardTitle>
              <Link href={`/patients/${id}/seance`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle séance
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {sessions?.sessions?.length > 0 ? (
                <div className="space-y-4">
                  {sessions.sessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{session.zone_nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.type_laser} • par {session.praticien_nom}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatDateTime(session.date_seance)}
                        </p>
                        {session.duree_minutes && (
                          <p className="text-sm text-muted-foreground">
                            {session.duree_minutes} min
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune séance enregistrée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
