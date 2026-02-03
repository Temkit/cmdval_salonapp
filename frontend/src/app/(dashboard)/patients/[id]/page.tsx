"use client";

import { use, useState } from "react";
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
  CreditCard,
  ChevronRight,
  Zap,
  Clock,
  Camera,
  X,
  Package,
  QrCode,
  Download,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import type { PatientZone, Session, PatientSubscription, SessionPhoto, Pack, Paiement, PaiementType, ModePaiement } from "@/types";
import { AddZoneDialog } from "@/components/features/patients/add-zone-dialog";
import { PreConsultationTab } from "@/components/features/patients/pre-consultation-tab";
import { AlertBanner } from "@/components/features/alerts/alert-banner";
import { useSessionStore } from "@/stores/session-store";
import { useAuthStore } from "@/stores/auth-store";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Check if this patient has an active session (wait for hydration)
  const hasHydrated = useSessionStore((s) => s._hasHydrated);
  const getSessionByPatient = useSessionStore((s) => s.getSessionByPatient);
  const activeSession = hasHydrated ? getSessionByPatient(id) : null;

  // Check if the active session belongs to current user
  const user = useAuthStore((s) => s.user);
  const isMySession = activeSession && user && activeSession.praticienId === user.id;

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(id),
  });

  const { data: sessions } = useQuery({
    queryKey: ["patient-sessions", id],
    queryFn: () => api.getPatientSessions(id, { page: 1, size: 10 }),
  });

  const { data: subscriptionsData } = useQuery({
    queryKey: ["patient-subscriptions", id],
    queryFn: () => api.getPatientSubscriptions(id),
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: paiementsData } = useQuery({
    queryKey: ["patient-paiements", id],
    queryFn: () => api.getPatientPaiements(id),
  });

  const { data: packsData } = useQuery({
    queryKey: ["packs"],
    queryFn: () => api.getPacks(),
  });

  // State for session detail dialog and tabs
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [subForm, setSubForm] = useState({ type: "pack" as string, pack_id: "", montant_paye: "" });
  const [payForm, setPayForm] = useState({ montant: "", type: "encaissement" as PaiementType, mode_paiement: "especes" as ModePaiement, reference: "", notes: "" });

  const createSubMutation = useMutation({
    mutationFn: (data: { type: string; pack_id?: string | null; montant_paye: number }) =>
      api.createSubscription(id, { type: data.type as "gold" | "pack" | "seance", pack_id: data.pack_id || null, montant_paye: data.montant_paye }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-subscriptions", id] });
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      toast({ title: "Souscription créée" });
      setSubDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const createPayMutation = useMutation({
    mutationFn: (data: { montant: number; type: PaiementType; mode_paiement: ModePaiement; reference?: string; notes?: string }) =>
      api.createPaiement({ patient_id: id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-paiements", id] });
      toast({ title: "Paiement enregistré" });
      setPayDialogOpen(false);
      setPayForm({ montant: "", type: "encaissement", mode_paiement: "especes", reference: "", notes: "" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
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
      <div className="space-y-2">
        <Breadcrumbs items={[
          { label: "Patients", href: "/patients" },
          { label: `${patient.prenom} ${patient.nom}` },
        ]} />
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/patients" aria-label="Retour a la liste des patients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="heading-2 truncate">Dossier patient</h1>
        </div>
      </div>

      {/* Alert Banner */}
      <AlertBanner patientId={id} />

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

            {/* QR + Docs + Action */}
            <div className="flex items-center gap-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={api.getPatientQRCodeUrl(id)}
                alt="QR Code patient"
                className="h-14 w-14 rounded-lg border hidden sm:block"
              />
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <Button variant="outline" size="icon-sm" asChild title="Consentement">
                    <a href={api.getPatientConsentUrl(id)} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon-sm" asChild title="Règlement">
                    <a href={api.getPatientRulesUrl(id)} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon-sm" asChild title="Précautions">
                    <a href={api.getPatientPrecautionsUrl(id)} target="_blank" rel="noopener noreferrer">
                      <QrCode className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link href={`/patients/${id}/seance`}>
                    <Zap className="h-4 w-4 mr-1" />
                    Séance
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Session Banner */}
      {activeSession && (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="p-4">
            <Link href="/seance-active" className="flex items-center gap-4">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                activeSession.isPaused ? "bg-yellow-500/20" : "bg-green-500/20"
              )}>
                <div className={cn(
                  "h-3 w-3 rounded-full",
                  activeSession.isPaused ? "bg-yellow-500" : "bg-green-500 animate-pulse"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={activeSession.isPaused ? "warning" : "success"} dot>
                    {activeSession.isPaused ? "En pause" : "En cours"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeSession.zoneName} • {activeSession.typeLaser} • Par {activeSession.praticienName}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Tabs - optimized for tablet click navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full flex-wrap sm:flex-nowrap justify-start">
          <TabsTrigger value="overview" className="gap-2 flex-1 sm:flex-none">
            <User className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="gap-2 flex-1 sm:flex-none">
            <Target className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Zones</span>
          </TabsTrigger>
          <TabsTrigger value="preconsultation" className="gap-2 flex-1 sm:flex-none">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Pre-consultation</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2 flex-1 sm:flex-none">
            <History className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Séances</span>
          </TabsTrigger>
          <TabsTrigger value="paiements" className="gap-2 flex-1 sm:flex-none">
            <Wallet className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Paiements</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
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
                <CardTitle className="text-base">Informations medicales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 -mx-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground">Phototype</span>
                  <span className="font-medium">{patient.phototype || "Non renseigne"}</span>
                </div>
                <div className="flex items-center justify-between p-3 -mx-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground">Sexe</span>
                  <span className="font-medium">{patient.sexe === "F" ? "Femme" : patient.sexe === "M" ? "Homme" : "Non renseigne"}</span>
                </div>
                {patient.notes && (
                  <div className="p-3 -mx-3 rounded-xl border">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    Voir l'onglet Pre-consultation pour les details medicaux complets.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscriptions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Abonnements
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => { setSubForm({ type: "pack", pack_id: "", montant_paye: "" }); setSubDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle souscription
                </Button>
              </div>
            </CardHeader>
            {subscriptionsData?.subscriptions && subscriptionsData.subscriptions.length > 0 ? (
              <CardContent>
                <div className="space-y-3">
                  {subscriptionsData.subscriptions.map((sub: PatientSubscription) => {
                    const now = new Date();
                    const endDate = sub.date_fin ? new Date(sub.date_fin) : null;
                    const daysRemaining = endDate
                      ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    const isExpired = daysRemaining !== null && daysRemaining < 0;

                    let countdownVariant: "default" | "secondary" | "destructive" | "outline" = "default";
                    let countdownClass = "";
                    if (isExpired) {
                      countdownVariant = "destructive";
                    } else if (daysRemaining !== null && daysRemaining < 7) {
                      countdownVariant = "destructive";
                    } else if (daysRemaining !== null && daysRemaining <= 30) {
                      countdownClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
                    }

                    return (
                      <div
                        key={sub.id}
                        className={cn(
                          "flex items-center gap-4 p-3 -mx-3 rounded-xl",
                          sub.is_active ? "bg-muted/50" : "bg-muted/20 opacity-60"
                        )}
                      >
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {sub.pack_nom || sub.type}
                            </p>
                            <Badge variant="secondary" size="sm">
                              {sub.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sub.date_debut && formatDate(sub.date_debut)}
                            {sub.date_fin && ` → ${formatDate(sub.date_fin)}`}
                          </p>
                        </div>
                        {daysRemaining !== null && (
                          <Badge
                            variant={countdownVariant}
                            className={cn("shrink-0", countdownClass)}
                          >
                            {isExpired
                              ? "Expire"
                              : daysRemaining === 0
                              ? "Aujourd'hui"
                              : `${daysRemaining}j`}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun abonnement actif
                </p>
              </CardContent>
            )}
          </Card>

          {/* Zones Progress */}
          {patient.zones?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Progression des zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.zones.map((zone: PatientZone) => (
                    <div key={zone.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{zone.zone_nom}</span>
                        <span className="text-muted-foreground">
                          {zone.seances_effectuees} / {zone.seances_prevues}
                        </span>
                      </div>
                      <Progress value={zone.progression} className="h-2.5" />
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
              {patient.zones.map((zone: PatientZone) => (
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
                          {Math.round(zone.progression)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {zone.seances_restantes} restante{zone.seances_restantes > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Progress value={zone.progression} className="h-2 mt-3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="Aucune zone configuree"
              description="Ajoutez des zones de traitement pour ce patient"
            >
              <AddZoneDialog patientId={id} existingZones={[]} />
            </EmptyState>
          )}
        </TabsContent>

        {/* Pre-consultation Tab */}
        <TabsContent value="preconsultation">
          <PreConsultationTab patientId={id} />
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

          {sessions?.sessions && sessions.sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.sessions.map((session: Session) => (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedSession(session)}
                >
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
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-medium">
                            {formatDate(session.date_seance)}
                          </p>
                          {session.duree_minutes && (
                            <p className="text-sm text-muted-foreground">
                              {session.duree_minutes} min
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="Aucune seance enregistree"
              description="Commencez par creer une premiere seance"
              action={{
                label: "Nouvelle seance",
                href: `/patients/${id}/seance`,
              }}
            />
          )}
        </TabsContent>
        {/* Paiements Tab */}
        <TabsContent value="paiements" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {paiementsData?.paiements?.length || 0} paiement{(paiementsData?.paiements?.length || 0) !== 1 ? "s" : ""}
            </p>
            <Button onClick={() => { setPayForm({ montant: "", type: "encaissement", mode_paiement: "especes", reference: "", notes: "" }); setPayDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau paiement
            </Button>
          </div>

          {paiementsData?.paiements && paiementsData.paiements.length > 0 ? (
            <div className="space-y-2">
              {paiementsData.paiements.map((pay: Paiement) => (
                <Card key={pay.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{pay.montant.toLocaleString()} DA</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(pay.date_paiement)}
                          {pay.reference && ` - Réf: ${pay.reference}`}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Badge variant="secondary" size="sm">{pay.type}</Badge>
                        {pay.mode_paiement && (
                          <Badge variant="outline" size="sm">{pay.mode_paiement}</Badge>
                        )}
                      </div>
                    </div>
                    {pay.notes && (
                      <p className="text-sm text-muted-foreground mt-2 pl-14">{pay.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Wallet}
              title="Aucun paiement"
              description="Les paiements du patient apparaîtront ici"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Subscription Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); createSubMutation.mutate({ type: subForm.type, pack_id: subForm.pack_id || null, montant_paye: parseFloat(subForm.montant_paye) || 0 }); }}>
            <DialogHeader>
              <DialogTitle>Nouvelle souscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={subForm.type} onValueChange={(v) => setSubForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="seance">Séance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {subForm.type === "pack" && (
                <div className="space-y-2">
                  <Label>Pack</Label>
                  <Select value={subForm.pack_id} onValueChange={(v) => setSubForm((p) => ({ ...p, pack_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un pack" /></SelectTrigger>
                    <SelectContent>
                      {packsData?.packs?.map((pack: Pack) => (
                        <SelectItem key={pack.id} value={pack.id}>{pack.nom} - {pack.prix} DA</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Montant payé (DA)</Label>
                <Input type="number" min="0" value={subForm.montant_paye} onChange={(e) => setSubForm((p) => ({ ...p, montant_paye: e.target.value }))} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createSubMutation.isPending}>
                {createSubMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); createPayMutation.mutate({ montant: parseFloat(payForm.montant) || 0, type: payForm.type, mode_paiement: payForm.mode_paiement, reference: payForm.reference || undefined, notes: payForm.notes || undefined }); }}>
            <DialogHeader>
              <DialogTitle>Nouveau paiement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Montant (DA)</Label>
                <Input type="number" min="0" value={payForm.montant} onChange={(e) => setPayForm((p) => ({ ...p, montant: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={payForm.type} onValueChange={(v) => setPayForm((p) => ({ ...p, type: v as PaiementType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="encaissement">Encaissement</SelectItem>
                      <SelectItem value="prise_en_charge">Prise en charge</SelectItem>
                      <SelectItem value="hors_carte">Hors carte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select value={payForm.mode_paiement} onValueChange={(v) => setPayForm((p) => ({ ...p, mode_paiement: v as ModePaiement }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Espèces</SelectItem>
                      <SelectItem value="carte">Carte</SelectItem>
                      <SelectItem value="virement">Virement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Référence (optionnel)</Label>
                <Input value={payForm.reference} onChange={(e) => setPayForm((p) => ({ ...p, reference: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea value={payForm.notes} onChange={(e) => setPayForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createPayMutation.isPending}>
                {createPayMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la séance</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              {/* Zone and Date */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{selectedSession.zone_nom}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(selectedSession.date_seance)}
                  </p>
                </div>
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Type de laser</p>
                  <p className="font-medium">{selectedSession.type_laser}</p>
                </div>
                {selectedSession.duree_minutes && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Durée</p>
                    <p className="font-medium">{selectedSession.duree_minutes} min</p>
                  </div>
                )}
                {selectedSession.fluence && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Fluence</p>
                    <p className="font-medium">{selectedSession.fluence}</p>
                  </div>
                )}
                {selectedSession.spot_size && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Spot size</p>
                    <p className="font-medium">{selectedSession.spot_size}</p>
                  </div>
                )}
                {selectedSession.frequence && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Fréquence</p>
                    <p className="font-medium">{selectedSession.frequence}</p>
                  </div>
                )}
                {selectedSession.tolerance && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Tolérance</p>
                    <p className="font-medium">{selectedSession.tolerance}</p>
                  </div>
                )}
              </div>

              {/* Practitioner */}
              <div className="flex items-center gap-3 p-3 border rounded-xl">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Praticien</p>
                  <p className="font-medium">{selectedSession.praticien_nom}</p>
                </div>
              </div>

              {/* Immediate Effects */}
              {selectedSession.effets_immediats && (
                <div className="p-3 border rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Effets immédiats</p>
                  <p className="text-sm">{selectedSession.effets_immediats}</p>
                </div>
              )}

              {/* Observations */}
              {selectedSession.observations && (
                <div className="p-3 border rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Observations</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedSession.observations}</p>
                </div>
              )}

              {/* Photos */}
              {selectedSession.photos?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{selectedSession.photos.length} photo(s)</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedSession.photos.map((photo: SessionPhoto, index: number) => (
                      <a
                        key={photo.id || index}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
