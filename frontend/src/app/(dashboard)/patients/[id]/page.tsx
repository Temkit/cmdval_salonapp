"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
  CreditCard,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
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
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 skeleton rounded-xl" />
          <div className="h-8 w-48 skeleton" />
        </div>
        {/* Content skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-48 skeleton" />
                <div className="h-4 w-32 skeleton" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="h-12 skeleton rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 skeleton" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 skeleton" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">Patient non trouvé</p>
        <p className="text-sm text-muted-foreground mt-1">
          Ce patient n'existe pas ou a été supprimé
        </p>
        <Button asChild className="mt-4">
          <Link href="/patients">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/patients">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="heading-2 truncate">Dossier patient</h1>
      </div>

      {/* Patient Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">
                {patient.prenom?.[0]}
                {patient.nom?.[0]}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {patient.prenom} {patient.nom}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {patient.code_carte && (
                  <Badge variant="secondary" className="gap-1">
                    <CreditCard className="h-3 w-3" />
                    {patient.code_carte}
                  </Badge>
                )}
                {patient.age && (
                  <Badge variant="outline">{patient.age} ans</Badge>
                )}
                {patient.sexe && (
                  <Badge variant="outline">
                    {patient.sexe === "F" ? "Femme" : "Homme"}
                  </Badge>
                )}
                {patient.phototype && (
                  <Badge variant="outline">Type {patient.phototype}</Badge>
                )}
              </div>
            </div>

            {/* Action Button */}
            <Button asChild size="lg" className="w-full sm:w-auto shrink-0">
              <Link href={`/patients/${id}/seance`}>
                <Zap className="h-5 w-5 mr-2" />
                Nouvelle séance
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs - optimized for tablet click navigation */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full flex-wrap sm:flex-nowrap justify-start">
          <TabsTrigger value="overview" className="gap-2 flex-1 sm:flex-none">
            <User className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="gap-2 flex-1 sm:flex-none">
            <Target className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Zones</span>
          </TabsTrigger>
          <TabsTrigger value="questionnaire" className="gap-2 flex-1 sm:flex-none">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Questionnaire</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2 flex-1 sm:flex-none">
            <History className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Séances</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Coordonnées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.telephone && (
                  <a
                    href={`tel:${patient.telephone}`}
                    className="flex items-center gap-3 p-3 -mx-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <p className="font-medium truncate">{patient.telephone}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </a>
                )}
                {patient.email && (
                  <a
                    href={`mailto:${patient.email}`}
                    className="flex items-center gap-3 p-3 -mx-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium truncate">{patient.email}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </a>
                )}
                {patient.adresse && (
                  <div className="flex items-start gap-3 p-3 -mx-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Adresse</p>
                      <p className="font-medium">{patient.adresse}</p>
                    </div>
                  </div>
                )}
                {patient.date_naissance && (
                  <div className="flex items-center gap-3 p-3 -mx-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Date de naissance</p>
                      <p className="font-medium">{formatDate(patient.date_naissance)}</p>
                    </div>
                  </div>
                )}
                {!patient.telephone && !patient.email && !patient.adresse && !patient.date_naissance && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune coordonnée renseignée
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Medical Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informations médicales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 -mx-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground">Questionnaire</span>
                  <Badge
                    variant={patient.questionnaire_complete ? "success" : "warning"}
                    dot
                  >
                    {patient.questionnaire_complete ? "Complet" : "Incomplet"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 -mx-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground">Phototype</span>
                  <span className="font-medium">{patient.phototype || "Non renseigné"}</span>
                </div>
                {patient.notes && (
                  <div className="p-3 -mx-3 rounded-xl border">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Zones Progress */}
          {patient.zones?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Progression des zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.zones.map((zone: any) => (
                    <div key={zone.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{zone.zone_nom}</span>
                        <span className="text-muted-foreground">
                          {zone.seances_effectuees} / {zone.seances_prevues}
                        </span>
                      </div>
                      <Progress value={zone.progression * 100} className="h-2.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {patient.zones?.length || 0} zone{(patient.zones?.length || 0) !== 1 ? "s" : ""} configurée{(patient.zones?.length || 0) !== 1 ? "s" : ""}
            </p>
            <AddZoneDialog patientId={id} existingZones={patient.zones || []} />
          </div>

          {patient.zones?.length > 0 ? (
            <div className="space-y-3">
              {patient.zones.map((zone: any) => (
                <Card key={zone.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{zone.zone_nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {zone.seances_effectuees} / {zone.seances_prevues} séances
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-primary">
                          {Math.round(zone.progression * 100)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {zone.seances_restantes} restante{zone.seances_restantes > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Progress value={zone.progression * 100} className="h-2 mt-3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="empty-state">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-lg">Aucune zone configurée</p>
                  <p className="text-sm mt-1">
                    Ajoutez des zones de traitement pour ce patient
                  </p>
                  <div className="mt-4">
                    <AddZoneDialog patientId={id} existingZones={[]} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Questionnaire Tab */}
        <TabsContent value="questionnaire">
          <QuestionnaireTab patientId={id} />
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sessions?.total || 0} séance{(sessions?.total || 0) !== 1 ? "s" : ""} enregistrée{(sessions?.total || 0) !== 1 ? "s" : ""}
            </p>
            <Button asChild>
              <Link href={`/patients/${id}/seance`}>
                <Plus className="h-5 w-5 mr-2" />
                Nouvelle séance
              </Link>
            </Button>
          </div>

          {sessions?.sessions?.length > 0 ? (
            <div className="space-y-3">
              {sessions.sessions.map((session: any) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{session.zone_nom}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" size="sm">
                            {session.type_laser}
                          </Badge>
                          <span className="text-sm text-muted-foreground truncate">
                            par {session.praticien_nom}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium">
                          {formatDate(session.date_seance)}
                        </p>
                        {session.duree_minutes && (
                          <p className="text-sm text-muted-foreground">
                            {session.duree_minutes} min
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="empty-state">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <History className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-lg">Aucune séance enregistrée</p>
                  <p className="text-sm mt-1">
                    Commencez par créer une première séance
                  </p>
                  <Button asChild className="mt-4">
                    <Link href={`/patients/${id}/seance`}>
                      <Plus className="h-5 w-5 mr-2" />
                      Nouvelle séance
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
