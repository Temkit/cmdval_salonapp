import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Play,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionStore, type PendingZone } from "@/stores/session-store";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { PatientZone } from "@/types";

interface SeanceSearch {
  queueEntryId?: string;
}

export const Route = createFileRoute("/practitioner/seance/$patientId")({
  validateSearch: (search: Record<string, unknown>): SeanceSearch => ({
    queueEntryId: (search.queueEntryId as string) || undefined,
  }),
  component: SeanceWizardPage,
});

const LASER_TYPES = ["Alexandrite", "Yag"];
const SPOT_SIZES = [12, 15, 16, 18, 20, 22, 25];

interface ZoneSelection {
  patientZone: PatientZone;
  selected: boolean;
  typeLaser: string;
  spotSize: string;
  fluence: string;
  pulseDurationMs: string;
  frequencyHz: string;
}

function SeanceWizardPage() {
  const { patientId } = Route.useParams();
  const { queueEntryId } = Route.useSearch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { startSession, setPendingZones } = useSessionStore();

  const [step, setStep] = useState(1);
  const [zones, setZones] = useState<ZoneSelection[]>([]);
  const [paramsLoaded, setParamsLoaded] = useState(false);

  // Fetch patient details
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => api.getPatient(patientId),
  });

  // Fetch alerts
  const { data: alertsData } = useQuery({
    queryKey: ["patient-alerts", patientId],
    queryFn: () => api.getPatientAlerts(patientId),
    enabled: !!patient,
  });

  // Initialize zone selections when patient loads
  useEffect(() => {
    if (patient?.zones && zones.length === 0) {
      const zoneSelections: ZoneSelection[] = patient.zones
        .filter((z) => z.seances_restantes > 0)
        .map((z) => ({
          patientZone: z,
          selected: false,
          typeLaser: "Alexandrite",
          spotSize: "18",
          fluence: "",
          pulseDurationMs: "",
          frequencyHz: "",
        }));
      setZones(zoneSelections);
    }
  }, [patient, zones.length]);

  // Load last session params for selected zones
  useEffect(() => {
    if (paramsLoaded) return;
    const selectedZones = zones.filter((z) => z.selected);
    if (selectedZones.length === 0 || step !== 2) return;

    setParamsLoaded(true);
    selectedZones.forEach((zone) => {
      api
        .getLastSessionParams(patientId, zone.patientZone.id)
        .then((params) => {
          setZones((prev) =>
            prev.map((z) =>
              z.patientZone.id === zone.patientZone.id
                ? {
                    ...z,
                    typeLaser: params.type_laser || z.typeLaser,
                    spotSize: params.spot_size || z.spotSize,
                    fluence: params.fluence || z.fluence,
                    pulseDurationMs: params.pulse_duration_ms || z.pulseDurationMs,
                    frequencyHz: params.frequency_hz || z.frequencyHz,
                  }
                : z,
            ),
          );
        })
        .catch(() => {
          // No previous params — keep defaults
        });
    });
  }, [step, zones, patientId, paramsLoaded]);

  const selectedZones = zones.filter((z) => z.selected);
  const alerts = alertsData?.alerts ?? [];
  const errorAlerts = alerts.filter((a) => a.severity === "error");

  const toggleZone = (zoneId: string) => {
    setZones((prev) =>
      prev.map((z) =>
        z.patientZone.id === zoneId ? { ...z, selected: !z.selected } : z,
      ),
    );
    setParamsLoaded(false);
  };

  const updateZoneParam = (
    zoneId: string,
    field: keyof ZoneSelection,
    value: string,
  ) => {
    setZones((prev) =>
      prev.map((z) =>
        z.patientZone.id === zoneId ? { ...z, [field]: value } : z,
      ),
    );
  };

  const handleStartSession = () => {
    if (!user || selectedZones.length === 0) return;

    const firstZone = selectedZones[0]!;
    const remaining = selectedZones.slice(1);

    // Set pending zones for multi-zone sessions
    if (remaining.length > 0) {
      const pendingZones: PendingZone[] = remaining.map((z) => ({
        patientId,
        patientName: `${patient?.prenom ?? ""} ${patient?.nom ?? ""}`.trim(),
        patientZoneId: z.patientZone.id,
        zoneName: z.patientZone.zone_nom,
        sessionNumber: z.patientZone.seances_effectuees + 1,
        totalSessions: z.patientZone.seances_prevues,
        typeLaser: z.typeLaser,
        spotSize: z.spotSize,
        fluence: z.fluence,
        pulseDurationMs: z.pulseDurationMs,
        frequencyHz: z.frequencyHz,
      }));
      setPendingZones(user.id, pendingZones);
    }

    // Start first zone
    startSession(user.id, `${user.prenom} ${user.nom}`, {
      patientId,
      patientName: `${patient?.prenom ?? ""} ${patient?.nom ?? ""}`.trim(),
      patientZoneId: firstZone.patientZone.id,
      zoneName: firstZone.patientZone.zone_nom,
      sessionNumber: firstZone.patientZone.seances_effectuees + 1,
      totalSessions: firstZone.patientZone.seances_prevues,
      typeLaser: firstZone.typeLaser,
      spotSize: firstZone.spotSize,
      fluence: firstZone.fluence,
      pulseDurationMs: firstZone.pulseDurationMs,
      frequencyHz: firstZone.frequencyHz,
      sideEffects: [],
      queueEntryId,
    });

    toast({ title: "Seance demarree" });
    navigate({ to: "/practitioner/active" as string } as Parameters<typeof navigate>[0]);
  };

  if (patientLoading) {
    return (
      <div className="page-container max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 skeleton rounded" />
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="h-6 w-64 skeleton rounded" />
              <div className="h-20 w-full skeleton rounded-xl" />
              <div className="h-20 w-full skeleton rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-container max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Patient introuvable</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() =>
                navigate({ to: "/practitioner" as string } as Parameters<typeof navigate>[0])
              }
            >
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            if (step > 1) {
              setStep(step - 1);
            } else {
              navigate({ to: "/practitioner" as string } as Parameters<typeof navigate>[0]);
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">
            {patient.prenom} {patient.nom}
          </h1>
          <p className="text-sm text-muted-foreground">
            Seance — Etape {step}/3
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card
          className={
            errorAlerts.length > 0
              ? "border-destructive/50 bg-destructive/5"
              : "border-amber-300/50 bg-amber-50 dark:bg-amber-950/10"
          }
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`h-4 w-4 mt-0.5 shrink-0 ${
                  errorAlerts.length > 0 ? "text-destructive" : "text-amber-600"
                }`}
              />
              <div className="space-y-1">
                {alerts.map((alert, i) => (
                  <p
                    key={i}
                    className={`text-sm ${
                      alert.severity === "error"
                        ? "text-destructive font-medium"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {alert.message}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Zone Selection */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Selectionner les zones</h2>
          {zones.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune zone avec des seances restantes
                </p>
              </CardContent>
            </Card>
          ) : (
            zones.map((zone) => {
              const z = zone.patientZone;
              const progress =
                z.seances_prevues > 0
                  ? Math.round((z.seances_effectuees / z.seances_prevues) * 100)
                  : 0;
              return (
                <Card
                  key={z.id}
                  className={`cursor-pointer transition-colors ${
                    zone.selected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggleZone(z.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          zone.selected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {zone.selected && (
                          <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{z.zone_nom}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Seance {z.seances_effectuees + 1}/{z.seances_prevues}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          <Button
            className="w-full"
            disabled={selectedZones.length === 0}
            onClick={() => setStep(2)}
          >
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 2: Laser Parameters */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Parametres laser</h2>

          {selectedZones.map((zone) => (
            <Card key={zone.patientZone.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {zone.patientZone.zone_nom}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Laser type */}
                <div className="space-y-2">
                  <Label className="text-xs">Type de laser</Label>
                  <div className="flex gap-2">
                    {LASER_TYPES.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={
                          zone.typeLaser === type ? "default" : "outline"
                        }
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          updateZoneParam(
                            zone.patientZone.id,
                            "typeLaser",
                            type,
                          )
                        }
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Spot size */}
                <div className="space-y-2">
                  <Label className="text-xs">Spot (mm)</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {SPOT_SIZES.map((size) => (
                      <Button
                        key={size}
                        type="button"
                        variant={
                          zone.spotSize === String(size) ? "default" : "outline"
                        }
                        size="sm"
                        className="h-8 w-10"
                        onClick={() =>
                          updateZoneParam(
                            zone.patientZone.id,
                            "spotSize",
                            String(size),
                          )
                        }
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Fluence, Pulse, Frequency */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fluence (J/cm2)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={zone.fluence}
                      onChange={(e) =>
                        updateZoneParam(
                          zone.patientZone.id,
                          "fluence",
                          e.target.value,
                        )
                      }
                      placeholder="--"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pulse (ms)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={zone.pulseDurationMs}
                      onChange={(e) =>
                        updateZoneParam(
                          zone.patientZone.id,
                          "pulseDurationMs",
                          e.target.value,
                        )
                      }
                      placeholder="--"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Freq (Hz)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={zone.frequencyHz}
                      onChange={(e) =>
                        updateZoneParam(
                          zone.patientZone.id,
                          "frequencyHz",
                          e.target.value,
                        )
                      }
                      placeholder="--"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button className="w-full" onClick={() => setStep(3)}>
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Confirmer la seance</h2>

          {/* Patient summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {patient.prenom?.[0]}
                    {patient.nom?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">
                    {patient.prenom} {patient.nom}
                  </p>
                  <div className="flex gap-1.5 mt-1">
                    {patient.phototype && (
                      <Badge variant="outline" size="sm">
                        Phototype {patient.phototype}
                      </Badge>
                    )}
                    {patient.code_carte && (
                      <Badge variant="outline" size="sm">
                        {patient.code_carte}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zones summary */}
          {selectedZones.map((zone) => (
            <Card key={zone.patientZone.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="h-4 w-4 text-primary shrink-0" />
                  <p className="font-medium text-sm">
                    {zone.patientZone.zone_nom}
                  </p>
                  <Badge variant="secondary" size="sm" className="ml-auto">
                    {zone.patientZone.seances_effectuees + 1}/
                    {zone.patientZone.seances_prevues}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" size="sm">
                    {zone.typeLaser}
                  </Badge>
                  {zone.spotSize && (
                    <Badge variant="outline" size="sm">
                      Spot {zone.spotSize}mm
                    </Badge>
                  )}
                  {zone.fluence && (
                    <Badge variant="outline" size="sm">
                      {zone.fluence} J/cm2
                    </Badge>
                  )}
                  {zone.pulseDurationMs && (
                    <Badge variant="outline" size="sm">
                      {zone.pulseDurationMs}ms
                    </Badge>
                  )}
                  {zone.frequencyHz && (
                    <Badge variant="outline" size="sm">
                      {zone.frequencyHz}Hz
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            size="lg"
            className="w-full text-lg h-14"
            onClick={handleStartSession}
          >
            <Play className="h-5 w-5 mr-2" />
            Demarrer la seance
          </Button>
        </div>
      )}
    </div>
  );
}
