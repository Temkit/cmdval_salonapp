import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Pause,
  Play,
  Camera,
  AlertTriangle,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  X,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import {
  useSessionStore,
  type SideEffect,
  type PhotoRef,
} from "@/stores/session-store";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { PatientInfoSheet } from "@/components/patient-info-sheet";

export const Route = createFileRoute("/practitioner/active")({
  component: ActiveSeancePage,
});

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ActiveSeancePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const {
    getSession,
    getElapsedSeconds,
    togglePause,
    addPhoto,
    removePhoto,
    addSideEffect,
    addNote,
    endSession,
    popNextZone,
    startSession,
    clearPendingZones,
  } = useSessionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [elapsed, setElapsed] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [showSideEffectForm, setShowSideEffectForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [sideEffectDesc, setSideEffectDesc] = useState("");
  const [sideEffectSeverity, setSideEffectSeverity] = useState<SideEffect["severity"]>("mild");
  const [noteText, setNoteText] = useState("");
  const [showPatientInfo, setShowPatientInfo] = useState(false);

  const praticienId = user?.id ?? "";
  const session = getSession(praticienId);

  // Timer tick
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds(praticienId));
    }, 1000);
    setElapsed(getElapsedSeconds(praticienId));
    return () => clearInterval(interval);
  }, [session, praticienId, getElapsedSeconds]);

  // Wake lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake lock not supported or denied
      }
    }
    if (session && !session.isPaused) {
      requestWakeLock();
    }
    return () => {
      wakeLock?.release();
    };
  }, [session, session?.isPaused]);

  const saveMutation = useMutation({
    mutationFn: async ({
      patientId,
      patientZoneId,
      durationSeconds,
      sessionData,
    }: {
      patientId: string;
      patientZoneId: string;
      durationSeconds: number;
      sessionData: NonNullable<ReturnType<typeof getSession>>;
    }) => {
      const formData = new FormData();
      formData.append("patient_zone_id", patientZoneId);
      formData.append("type_laser", sessionData.typeLaser);
      formData.append("duree_secondes", String(durationSeconds));
      if (sessionData.spotSize) formData.append("spot_size", sessionData.spotSize);
      if (sessionData.fluence) formData.append("fluence", sessionData.fluence);
      if (sessionData.pulseDurationMs)
        formData.append("pulse_duration_ms", sessionData.pulseDurationMs);
      if (sessionData.frequencyHz)
        formData.append("frequency_hz", sessionData.frequencyHz);
      if (sessionData.tolerance)
        formData.append("tolerance", sessionData.tolerance);
      if (sessionData.frequence)
        formData.append("frequence", sessionData.frequence);
      if (sessionData.effetsImmediats)
        formData.append("effets_immediats", sessionData.effetsImmediats);
      if (sessionData.notes) formData.append("observations", sessionData.notes);
      if (sessionData.sideEffects.length > 0) {
        formData.append(
          "side_effects",
          JSON.stringify(sessionData.sideEffects),
        );
      }
      // Photo IDs
      sessionData.photos.forEach((p) => {
        formData.append("photo_ids", p.id);
      });

      return api.createSession(patientId, formData);
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur sauvegarde",
        description: err.message,
      });
    },
  });

  const handlePhotoCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !session) return;

      try {
        const result = await api.uploadTempPhoto(file);
        addPhoto(praticienId, { id: result.id, url: result.url });
        toast({ title: "Photo ajoutee" });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Erreur photo",
          description: (err as Error).message,
        });
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [session, praticienId, addPhoto, toast],
  );

  const handleAddSideEffect = () => {
    if (!sideEffectDesc.trim()) return;
    addSideEffect(praticienId, {
      description: sideEffectDesc.trim(),
      severity: sideEffectSeverity,
      photos: [],
    });
    setSideEffectDesc("");
    setShowSideEffectForm(false);
    toast({ title: "Effet secondaire enregistre" });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote(praticienId, noteText.trim());
    setNoteText("");
    setShowNoteForm(false);
    toast({ title: "Note ajoutee" });
  };

  const handleEndSession = async () => {
    if (!user) return;

    const result = endSession(praticienId);
    if (!result) return;

    const { session: endedSession, durationSeconds } = result;

    // Save to backend
    try {
      await saveMutation.mutateAsync({
        patientId: endedSession.patientId,
        patientZoneId: endedSession.patientZoneId,
        durationSeconds,
        sessionData: endedSession,
      });

      // Check for pending zones
      const nextZone = popNextZone(praticienId);
      if (nextZone) {
        startSession(user.id, `${user.prenom} ${user.nom}`, {
          patientId: nextZone.patientId,
          patientName: nextZone.patientName,
          patientZoneId: nextZone.patientZoneId,
          zoneName: nextZone.zoneName,
          sessionNumber: nextZone.sessionNumber,
          totalSessions: nextZone.totalSessions,
          typeLaser: nextZone.typeLaser,
          spotSize: nextZone.spotSize,
          fluence: nextZone.fluence,
          pulseDurationMs: nextZone.pulseDurationMs,
          frequencyHz: nextZone.frequencyHz,
          sideEffects: [],
          queueEntryId: endedSession.queueEntryId,
        });
        toast({ title: `Zone suivante: ${nextZone.zoneName}` });
        setShowEndConfirm(false);
        setDrawerOpen(false);
        return;
      }

      // Complete queue entry
      if (endedSession.queueEntryId) {
        try {
          await api.completePatient(endedSession.queueEntryId);
        } catch {
          // Queue completion failure is non-critical
        }
      }

      clearPendingZones(praticienId);
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({ title: "Seance terminee et sauvegardee" });
      navigate({ to: "/practitioner" as string } as Parameters<typeof navigate>[0]);
    } catch {
      // Error handled in mutation
    }
  };

  // No active session — redirect
  if (!session) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">Aucune seance en cours</p>
            <Button
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
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Timer area — top 60% */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 select-none">
        {/* Patient & zone info */}
        <p
          className="text-sm text-muted-foreground mb-1 cursor-pointer hover:text-primary transition-colors"
          onClick={() => setShowPatientInfo(true)}
        >
          {session.patientName}
        </p>
        <div className="flex items-center gap-2 mb-6">
          <Badge variant="secondary">{session.zoneName}</Badge>
          <Badge variant="outline" size="sm">
            {session.sessionNumber}/{session.totalSessions}
          </Badge>
        </div>

        {/* Giant timer */}
        <div
          className={`font-mono text-7xl sm:text-8xl font-bold tabular-nums tracking-tight ${
            session.isPaused ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {formatTimer(elapsed)}
        </div>

        {/* Pause indicator */}
        {session.isPaused && (
          <p className="text-sm text-amber-600 font-medium mt-2">EN PAUSE</p>
        )}

        {/* Laser params pills */}
        <div className="flex flex-wrap gap-1.5 mt-6 justify-center">
          <Badge variant="outline" size="sm">
            {session.typeLaser}
          </Badge>
          {session.spotSize && (
            <Badge variant="outline" size="sm">
              {session.spotSize}mm
            </Badge>
          )}
          {session.fluence && (
            <Badge variant="outline" size="sm">
              {session.fluence} J/cm2
            </Badge>
          )}
          {session.pulseDurationMs && (
            <Badge variant="outline" size="sm">
              {session.pulseDurationMs}ms
            </Badge>
          )}
          {session.frequencyHz && (
            <Badge variant="outline" size="sm">
              {session.frequencyHz}Hz
            </Badge>
          )}
        </div>

        {/* Pause/Resume button */}
        <Button
          variant={session.isPaused ? "default" : "outline"}
          size="lg"
          className="mt-8 h-14 w-14 rounded-full"
          onClick={() => togglePause(praticienId)}
        >
          {session.isPaused ? (
            <Play className="h-6 w-6" />
          ) : (
            <Pause className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Pull-up drawer */}
      <div
        className={`border-t bg-card transition-all duration-300 ${
          drawerOpen ? "max-h-[60vh]" : "max-h-16"
        } overflow-hidden`}
      >
        {/* Drawer handle */}
        <button
          className="w-full flex items-center justify-center py-2 hover:bg-muted/50 transition-colors"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 rounded-full bg-muted-foreground/30" />
            {drawerOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Drawer content */}
        <div className="px-4 pb-4 space-y-3 overflow-y-auto max-h-[calc(60vh-4rem)]">
          {/* Quick actions */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-1.5" />
              Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setShowSideEffectForm(true);
                setShowNoteForm(false);
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              Effet
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setShowNoteForm(true);
                setShowSideEffectForm(false);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Note
            </Button>
          </div>

          {/* Side effect form */}
          {showSideEffectForm && (
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Effet secondaire</Label>
                  <button onClick={() => setShowSideEffectForm(false)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <Input
                  placeholder="Description..."
                  value={sideEffectDesc}
                  onChange={(e) => setSideEffectDesc(e.target.value)}
                />
                <div className="flex gap-2">
                  {(["mild", "moderate", "severe"] as const).map((sev) => (
                    <Button
                      key={sev}
                      type="button"
                      variant={sideEffectSeverity === sev ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setSideEffectSeverity(sev)}
                    >
                      {sev === "mild"
                        ? "Leger"
                        : sev === "moderate"
                          ? "Modere"
                          : "Severe"}
                    </Button>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleAddSideEffect}
                  disabled={!sideEffectDesc.trim()}
                >
                  Ajouter
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Note form */}
          {showNoteForm && (
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Note / Commentaire</Label>
                  <button onClick={() => setShowNoteForm(false)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <Textarea
                  placeholder="Ecrire un commentaire..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                >
                  Ajouter
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Photos preview */}
          {session.photos.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Photos ({session.photos.length})
              </p>
              <div className="flex gap-2 overflow-x-auto">
                {session.photos.map((photo: PhotoRef) => (
                  <div key={photo.id} className="relative shrink-0">
                    <img
                      src={photo.url}
                      alt="Session photo"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <button
                      className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      onClick={() => removePhoto(praticienId, photo.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side effects list */}
          {session.sideEffects.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Effets ({session.sideEffects.length})
              </p>
              {session.sideEffects.map((effect: SideEffect, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-lg"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="flex-1 text-xs">{effect.description}</span>
                  <Badge
                    variant={
                      effect.severity === "severe"
                        ? "destructive"
                        : effect.severity === "moderate"
                          ? "warning"
                          : "muted"
                    }
                    size="sm"
                  >
                    {effect.severity === "mild"
                      ? "Leger"
                      : effect.severity === "moderate"
                        ? "Modere"
                        : "Severe"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Notes list */}
          {session.notes && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Commentaires ({session.notes.split("\n").filter(Boolean).length})
              </p>
              {session.notes.split("\n").filter(Boolean).map((note: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded-lg"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="flex-1 text-xs">{note}</span>
                </div>
              ))}
            </div>
          )}

          {/* End session */}
          {!showEndConfirm ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowEndConfirm(true)}
            >
              Terminer la seance
            </Button>
          ) : (
            <Card className="border-destructive/50">
              <CardContent className="p-3 space-y-3">
                <p className="text-sm font-medium text-center">
                  Confirmer la fin de seance ?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowEndConfirm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleEndSession}
                    disabled={saveMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    {saveMutation.isPending ? "Sauvegarde..." : "Confirmer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PatientInfoSheet
        patientId={session.patientId}
        open={showPatientInfo}
        onOpenChange={setShowPatientInfo}
      />
    </div>
  );
}
