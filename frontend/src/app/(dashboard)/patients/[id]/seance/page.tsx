"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Zap,
  Settings2,
  ChevronRight,
  User,
  AlertTriangle,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ButtonGroup, NumberStepper, ZoneCard } from "@/components/ui/button-group";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { useSessionStore, PendingZone } from "@/stores/session-store";
import { useAuthStore } from "@/stores/auth-store";
import { AddZoneDialog } from "@/components/features/patients/add-zone-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PatientZone, User as UserType, Alert } from "@/types";

// Optiskin specific parameters
const LASER_TYPES = [
  { value: "Alexandrite", label: "Alexandrite" },
  { value: "Yag", label: "Yag" },
];

const SPOT_SIZES = [12, 15, 16, 18, 20, 22, 25];
const PULSE_DURATIONS_MS = [1, 2, 3, 5, 10];

export default function NewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const startSession = useSessionStore((s) => s.startSession);
  const getSession = useSessionStore((s) => s.getSession);
  const setPendingZones = useSessionStore((s) => s.setPendingZones);

  const isAdmin = user?.role_nom === "Admin";

  const [selectedZones, setSelectedZones] = useState<PatientZone[]>([]);
  const [activeConfigZone, setActiveConfigZone] = useState<PatientZone | null>(null);
  const [typeLaser, setTypeLaser] = useState("");
  const [spotSize, setSpotSize] = useState<number | null>(null);
  const [fluence, setFluence] = useState("");
  const [pulseDuration, setPulseDuration] = useState<number | null>(null);
  const [frequencyHz, setFrequencyHz] = useState("");
  const [selectedPraticien, setSelectedPraticien] = useState<string>("");
  const [zoneAlerts, setAlerts] = useState<Alert[]>([]);

  // Alias for backwards-compat with alert logic
  const selectedZone = activeConfigZone;

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(id),
  });

  // Fetch patient alerts
  const { data: alertsData } = useQuery({
    queryKey: ["patient-alerts", id],
    queryFn: () => api.getPatientAlerts(id),
    enabled: !!id,
  });

  // Fetch last session params for active config zone (quick-start)
  const { data: lastParams } = useQuery({
    queryKey: ["last-session-params", id, activeConfigZone?.id],
    queryFn: () => api.getLastSessionParams(id, activeConfigZone!.id),
    enabled: !!activeConfigZone,
    retry: false,
  });

  const [paramsApplied, setParamsApplied] = useState(false);

  const applyLastParams = () => {
    if (!lastParams) return;
    if (lastParams.type_laser) setTypeLaser(lastParams.type_laser);
    if (lastParams.spot_size) setSpotSize(parseInt(lastParams.spot_size));
    if (lastParams.fluence) setFluence(lastParams.fluence);
    if (lastParams.pulse_duration_ms) setPulseDuration(parseInt(lastParams.pulse_duration_ms));
    if (lastParams.frequency_hz) setFrequencyHz(lastParams.frequency_hz);
    setParamsApplied(true);
    haptics.medium();
  };

  // Reset paramsApplied when active config zone changes
  useEffect(() => {
    setParamsApplied(false);
  }, [activeConfigZone?.id]);

  // Fetch practitioners for admin to assign sessions
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
    enabled: isAdmin,
  });

  const practitioners = usersData?.users || [];

  // Update zone alerts when active config zone is selected
  useEffect(() => {
    if (activeConfigZone && alertsData?.alerts) {
      const alerts = alertsData.alerts.filter(
        (a: Alert) =>
          a.zone_id === activeConfigZone.zone_definition_id ||
          a.type === "contraindication"
      );
      setAlerts(alerts);
    } else {
      setAlerts([]);
    }
  }, [activeConfigZone, alertsData]);

  // For non-admin: redirect if they already have an active session
  const activeSession = user ? getSession(user.id) : null;
  if (!isAdmin && activeSession) {
    router.push("/seance-active");
    return null;
  }

  const handleZoneSelect = (zone: PatientZone) => {
    haptics.selection();
    setSelectedZones((prev) => {
      const isSelected = prev.some((z: PatientZone) => z.id === zone.id);
      if (isSelected) {
        const updated = prev.filter((z: PatientZone) => z.id !== zone.id);
        // If we just removed the active config zone, switch to first remaining
        if (activeConfigZone?.id === zone.id) {
          setActiveConfigZone(updated[0] || null);
        }
        return updated;
      }
      const updated = [...prev, zone];
      // Auto-select first zone as active config zone
      if (!activeConfigZone) {
        setActiveConfigZone(zone);
      }
      return updated;
    });
  };

  const handleStartSession = () => {
    // Check for pre-consultation first
    if (hasNoPreConsultation) {
      toast({
        variant: "destructive",
        title: "Pre-consultation requise",
        description: "Ce patient doit avoir une pre-consultation validee avant de commencer une seance.",
      });
      return;
    }

    if (selectedZones.length === 0) {
      toast({
        variant: "destructive",
        title: "Zone requise",
        description: "Veuillez selectionner au moins une zone de traitement.",
      });
      return;
    }

    if (!typeLaser) {
      toast({
        variant: "destructive",
        title: "Laser requis",
        description: "Veuillez selectionner un type de laser.",
      });
      return;
    }

    if (!spotSize) {
      toast({
        variant: "destructive",
        title: "Spot requis",
        description: "Veuillez selectionner une taille de spot.",
      });
      return;
    }

    if (!fluence) {
      toast({
        variant: "destructive",
        title: "Fluence requise",
        description: "Veuillez saisir la fluence.",
      });
      return;
    }

    if (!pulseDuration) {
      toast({
        variant: "destructive",
        title: "Temps requis",
        description: "Veuillez selectionner le temps MS.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Vous devez etre connecte pour demarrer une seance.",
      });
      return;
    }

    // Check for blocking errors (contraindications, ineligible zones)
    const hasBlockingErrors = zoneAlerts.some((a) => a.severity === "error");
    if (hasBlockingErrors) {
      toast({
        variant: "destructive",
        title: "Impossible de demarrer",
        description:
          "Cette zone a des alertes bloquantes. Consultez les alertes ci-dessus.",
      });
      return;
    }

    // For admin: must select a practitioner
    if (isAdmin && !selectedPraticien) {
      toast({
        variant: "destructive",
        title: "Praticien requis",
        description: "Veuillez selectionner un praticien pour cette seance.",
      });
      return;
    }

    // Get the practitioner info
    let praticienId = user.id;
    let praticienName = `${user.prenom} ${user.nom}`;

    if (isAdmin && selectedPraticien) {
      const selectedUser = practitioners.find(
        (p: UserType) => p.id === selectedPraticien
      );
      if (selectedUser) {
        praticienId = selectedUser.id;
        praticienName = `${selectedUser.prenom} ${selectedUser.nom}`;
      }
    }

    // Check if this practitioner already has an active session
    const existingSession = getSession(praticienId);
    if (existingSession) {
      toast({
        variant: "destructive",
        title: "Seance en cours",
        description: `${praticienName} a deja une seance en cours.`,
      });
      return;
    }

    haptics.heavy();

    // First zone starts immediately
    const firstZone = selectedZones[0];

    // Remaining zones go to pending queue (all share same laser params)
    if (selectedZones.length > 1) {
      const remaining: PendingZone[] = selectedZones.slice(1).map((zone: PatientZone) => ({
        patientId: id,
        patientName: `${patient!.prenom} ${patient!.nom}`,
        patientZoneId: zone.id,
        zoneName: zone.zone_nom,
        sessionNumber: zone.seances_effectuees + 1,
        totalSessions: zone.seances_prevues,
        typeLaser,
        spotSize: spotSize?.toString(),
        fluence,
        pulseDurationMs: pulseDuration?.toString(),
        frequencyHz: frequencyHz || undefined,
      }));
      setPendingZones(praticienId, remaining);
    }

    // Start session in store with Optiskin parameters
    startSession(praticienId, praticienName, {
      patientId: id,
      patientName: `${patient!.prenom} ${patient!.nom}`,
      patientZoneId: firstZone.id,
      zoneName: firstZone.zone_nom,
      sessionNumber: firstZone.seances_effectuees + 1,
      totalSessions: firstZone.seances_prevues,
      typeLaser,
      spotSize: spotSize?.toString(),
      fluence,
      pulseDurationMs: pulseDuration?.toString(),
      frequencyHz: frequencyHz || undefined,
      sideEffects: [],
    });

    // Navigate to active session
    router.push("/seance-active");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 skeleton rounded-xl" />
          <div className="h-6 w-32 skeleton" />
        </div>
        <div className="h-32 skeleton rounded-2xl" />
        <div className="h-24 skeleton rounded-2xl" />
        <div className="h-24 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-lg font-medium">Patient non trouve</p>
            <Button asChild className="mt-4">
              <Link href="/patients">Retour a la liste</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeZones =
    patient.zones?.filter((z: PatientZone) => z.seances_restantes > 0) || [];

  // Check if patient has pre-consultation
  const hasNoPreConsultation = alertsData?.alerts?.some(
    (a: Alert) => a.type === "no_pre_consultation" || a.type === "pre_consultation_pending"
  );

  // Check if patient has global contraindications
  const globalAlerts =
    alertsData?.alerts?.filter(
      (a: Alert) => a.type === "contraindication"
    ) || [];
  const hasErrors = alertsData?.has_errors || false;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={`/patients/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="heading-2">Nouvelle seance</h1>
          <p className="text-sm text-muted-foreground">
            {patient.prenom} {patient.nom}
          </p>
        </div>
      </div>

      {/* Pre-consultation Required Banner */}
      {hasNoPreConsultation && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">
                Pre-consultation requise
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Ce patient n'a pas de pre-consultation validee. Les seances ne peuvent pas etre demarrees sans pre-consultation prealable par le medecin.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/pre-consultations/nouveau">
                  Creer une pre-consultation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contraindication Alerts Banner */}
      {!hasNoPreConsultation && globalAlerts.length > 0 && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">
                Contre-indications detectees
              </p>
              <ul className="mt-1 space-y-1">
                {globalAlerts.map((alert: Alert, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Zone Selection */}
      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Zone de traitement
        </h2>
        {activeZones.length > 0 ? (
          <div className="space-y-2">
            {activeZones.map((zone: PatientZone) => {
              const zoneSpecificAlerts =
                alertsData?.alerts?.filter(
                  (a: Alert) => a.zone_id === zone.zone_definition_id
                ) || [];
              const hasZoneError = zoneSpecificAlerts.some(
                (a: Alert) => a.severity === "error"
              );
              const hasZoneWarning = zoneSpecificAlerts.some(
                (a: Alert) => a.severity === "warning"
              );

              return (
                <div key={zone.id} className="relative">
                  <ZoneCard
                    zone={zone}
                    selected={selectedZones.some((z: PatientZone) => z.id === zone.id)}
                    onSelect={() => handleZoneSelect(zone)}
                  />
                  {(hasZoneError || hasZoneWarning) && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {hasZoneError && (
                        <div className="p-1 bg-destructive rounded-full">
                          <XCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {hasZoneWarning && !hasZoneError && (
                        <div className="p-1 bg-yellow-500 rounded-full">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Aucune zone disponible</p>
              <p className="text-sm text-muted-foreground mt-1">
                Toutes les zones sont terminees ou aucune zone configuree
              </p>
              <div className="mt-4">
                <AddZoneDialog
                  patientId={id}
                  existingZones={
                    patient.zones?.map((z: PatientZone) => ({
                      zone_definition_id: z.zone_definition_id,
                    })) || []
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Multi-zone Queue */}
      {selectedZones.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">
              {selectedZones.length} zones selectionnees
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedZones.map((zone: PatientZone, index: number) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => {
                    setActiveConfigZone(zone);
                    haptics.selection();
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    activeConfigZone?.id === zone.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {index + 1}. {zone.zone_nom}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone-specific Alerts */}
      {zoneAlerts.length > 0 && (
        <div className="space-y-2">
          {zoneAlerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                "p-3 rounded-xl flex items-start gap-3",
                alert.severity === "error"
                  ? "bg-destructive/10 border border-destructive/30"
                  : "bg-yellow-500/10 border border-yellow-500/30"
              )}
            >
              {alert.severity === "error" ? (
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
              )}
              <div>
                <p
                  className={cn(
                    "font-medium text-sm",
                    alert.severity === "error"
                      ? "text-destructive"
                      : "text-yellow-700"
                  )}
                >
                  {alert.message}
                </p>
                {alert.type === "spacing" && (alert.details as Record<string, number> | undefined)?.days_since && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {(alert.details as Record<string, number>).days_since} jours depuis la derniere seance
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick-start: Apply last session params */}
      {lastParams && !paramsApplied && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <RotateCcw className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm">Parametres de la derniere seance</p>
                <p className="text-xs text-muted-foreground truncate">
                  {lastParams.type_laser}
                  {lastParams.spot_size && ` • Spot ${lastParams.spot_size}`}
                  {lastParams.fluence && ` • ${lastParams.fluence} J/cm²`}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={applyLastParams}>
              Appliquer
            </Button>
          </div>
        </div>
      )}

      {/* Practitioner Selection (Admin only) */}
      {isAdmin && (
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Praticien
          </h2>
          <Select
            value={selectedPraticien}
            onValueChange={setSelectedPraticien}
          >
            <SelectTrigger className="h-14 text-base">
              <SelectValue placeholder="Selectionner un praticien" />
            </SelectTrigger>
            <SelectContent>
              {practitioners.map((p: UserType) => (
                <SelectItem key={p.id} value={p.id} className="py-3">
                  {p.prenom} {p.nom}
                  {getSession(p.id) && (
                    <span className="ml-2 text-xs text-yellow-600">
                      (seance en cours)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Laser Type */}
      <div>
        <h2 className="font-semibold mb-3">Type de laser *</h2>
        <ButtonGroup
          options={LASER_TYPES}
          value={typeLaser}
          onChange={(v) => {
            haptics.selection();
            setTypeLaser(v);
          }}
          columns={2}
          size="lg"
        />
      </div>

      {/* Optiskin Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Parametres Optiskin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Spot Size */}
          <div>
            <Label className="text-sm font-medium">Spot *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SPOT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setSpotSize(size);
                  }}
                  className={cn(
                    "min-h-[48px] min-w-[48px] px-3 rounded-xl border-2 font-semibold transition-all active:scale-95",
                    spotSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Fluence */}
          <div>
            <Label className="text-sm font-medium">Fluence (J/cm2) *</Label>
            <NumberStepper
              value={fluence}
              onChange={setFluence}
              min={1}
              max={100}
              step={1}
              unit=" J/cm²"
              presets={[8, 10, 12, 15, 18, 20]}
              className="mt-2"
            />
          </div>

          {/* Pulse Duration */}
          <div>
            <Label className="text-sm font-medium">Temps MS *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PULSE_DURATIONS_MS.map((ms) => (
                <button
                  key={ms}
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setPulseDuration(ms);
                  }}
                  className={cn(
                    "min-h-[48px] min-w-[48px] px-3 rounded-xl border-2 font-semibold transition-all active:scale-95",
                    pulseDuration === ms
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {ms}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <Label className="text-sm font-medium">Frequence Hz</Label>
            <NumberStepper
              value={frequencyHz}
              onChange={setFrequencyHz}
              min={1}
              max={20}
              step={1}
              unit=" Hz"
              presets={[1, 2, 3, 5, 8, 10]}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Button
        size="lg"
        className="w-full h-14 text-lg font-semibold"
        onClick={handleStartSession}
        disabled={selectedZones.length === 0 || hasErrors || hasNoPreConsultation}
      >
        <Zap className="h-6 w-6 mr-2" />
        {selectedZones.length > 1
          ? `Demarrer ${selectedZones.length} zones`
          : "Demarrer la seance"}
        <ChevronRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}
