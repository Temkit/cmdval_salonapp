"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Zap, Settings2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ButtonGroup, ZoneCard } from "@/components/ui/button-group";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { useSessionStore } from "@/stores/session-store";

const LASER_TYPES = [
  { value: "Alexandrite", label: "Alexandrite" },
  { value: "Diode", label: "Diode" },
  { value: "Nd:YAG", label: "Nd:YAG" },
  { value: "IPL", label: "IPL" },
];

const FLUENCE_PRESETS = [15, 20, 25, 30, 35, 40];
const SPOT_PRESETS = [8, 10, 12, 15, 18];

export default function NewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const startSession = useSessionStore((s) => s.startSession);
  const activeSession = useSessionStore((s) => s.activeSession);

  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [typeLaser, setTypeLaser] = useState("");
  const [fluence, setFluence] = useState("");
  const [spotSize, setSpotSize] = useState("");

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(id),
  });

  // Redirect if there's already an active session
  if (activeSession) {
    router.push("/seance-active");
    return null;
  }

  const handleZoneSelect = (zone: any) => {
    haptics.selection();
    setSelectedZone(zone);
  };

  const handleStartSession = () => {
    if (!selectedZone) {
      toast({
        variant: "destructive",
        title: "Zone requise",
        description: "Veuillez sélectionner une zone de traitement.",
      });
      return;
    }

    if (!typeLaser) {
      toast({
        variant: "destructive",
        title: "Laser requis",
        description: "Veuillez sélectionner un type de laser.",
      });
      return;
    }

    haptics.heavy();

    // Start session in store
    startSession({
      patientId: id,
      patientName: `${patient.prenom} ${patient.nom}`,
      patientZoneId: selectedZone.id,
      zoneName: selectedZone.zone_nom,
      sessionNumber: selectedZone.seances_effectuees + 1,
      totalSessions: selectedZone.seances_prevues,
      typeLaser,
      fluence: fluence || undefined,
      spotSize: spotSize || undefined,
    });

    // Navigate to active session
    router.push("/seance-active");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="sticky top-0 z-40 bg-background border-b px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <div className="h-10 w-10 skeleton rounded-xl" />
            <div className="h-6 w-32 skeleton" />
          </div>
        </div>
        <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-24 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-lg font-medium">Patient non trouvé</p>
        <Button asChild className="mt-4">
          <Link href="/patients">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const activeZones = patient.zones?.filter(
    (z: any) => z.seances_restantes > 0
  ) || [];

  return (
    <div className="min-h-screen flex flex-col pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/patients/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <span className="font-semibold">Nouvelle séance</span>
            <p className="text-sm text-muted-foreground">
              {patient.prenom} {patient.nom}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
        {/* Zone Selection */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Zone de traitement
          </h2>
          {activeZones.length > 0 ? (
            <div className="space-y-2">
              {activeZones.map((zone: any) => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  selected={selectedZone?.id === zone.id}
                  onSelect={() => handleZoneSelect(zone)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Aucune zone disponible</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Toutes les zones sont terminées ou aucune zone configurée
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/patients/${id}`}>
                    Ajouter une zone
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Laser Type */}
        <div>
          <h2 className="font-semibold mb-3">Type de laser</h2>
          <ButtonGroup
            options={LASER_TYPES}
            value={typeLaser}
            onChange={(v) => {
              haptics.selection();
              setTypeLaser(v);
            }}
            columns={4}
            size="lg"
          />
        </div>

        {/* Quick Parameters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Paramètres rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fluence */}
            <div>
              <Label className="text-sm text-muted-foreground">Fluence (J/cm²)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {FLUENCE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      haptics.selection();
                      setFluence(preset.toString());
                    }}
                    className={`
                      min-h-[48px] min-w-[48px] px-3 rounded-xl border-2 font-semibold transition-all active:scale-95
                      ${fluence === preset.toString()
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                      }
                    `}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Spot Size */}
            <div>
              <Label className="text-sm text-muted-foreground">Spot (mm)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SPOT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      haptics.selection();
                      setSpotSize(preset.toString());
                    }}
                    className={`
                      min-h-[48px] min-w-[48px] px-3 rounded-xl border-2 font-semibold transition-all active:scale-95
                      ${spotSize === preset.toString()
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                      }
                    `}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action - THUMB ZONE */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t p-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto">
          <Button
            size="lg"
            className="w-full h-16 text-lg font-semibold rounded-2xl"
            onClick={handleStartSession}
            disabled={activeZones.length === 0}
          >
            <Zap className="h-6 w-6 mr-3" />
            Démarrer la séance
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
