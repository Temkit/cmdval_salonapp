"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Pause,
  StopCircle,
  Camera,
  Clock,
  User,
  Target,
  Users,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { useSessionStore, SideEffect, PhotoRef, PendingZone } from "@/stores/session-store";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { CameraCapture } from "@/components/ui/camera-capture";
import { EmptyState } from "@/components/ui/empty-state";

export default function SeanceActivePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Auth store
  const user = useAuthStore((s) => s.user);

  // Session store - get functions
  const hasHydrated = useSessionStore((s) => s._hasHydrated);
  const getSession = useSessionStore((s) => s.getSession);
  const getAllSessions = useSessionStore((s) => s.getAllSessions);
  const togglePause = useSessionStore((s) => s.togglePause);
  const addPhoto = useSessionStore((s) => s.addPhoto);
  const removePhoto = useSessionStore((s) => s.removePhoto);
  const addSideEffect = useSessionStore((s) => s.addSideEffect);
  const endSession = useSessionStore((s) => s.endSession);
  const getElapsedSeconds = useSessionStore((s) => s.getElapsedSeconds);
  const popNextZone = useSessionStore((s) => s.popNextZone);
  const pendingZones = useSessionStore((s) => s.pendingZones);
  const startSession = useSessionStore((s) => s.startSession);

  // Get active session for current user (only after hydration)
  const activeSession = hasHydrated && user ? getSession(user.id) : null;
  // Warn user before leaving when a session is active
  useUnsavedChanges(!!activeSession);
  // Get all active sessions for display
  const allSessions = getAllSessions();

  // Check if user is admin
  const isAdmin = user?.role_nom === "Admin";
  // Get other practitioners' sessions (only for admins)
  const otherSessions = isAdmin ? allSessions.filter((s) => s.praticienId !== user?.id) : [];

  // Local state for timer display
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [otherSessionsTimes, setOtherSessionsTimes] = useState<Record<string, number>>({});
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [endNotes, setEndNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [sideEffectCameraOpen, setSideEffectCameraOpen] = useState(false);
  const [showSideEffectForm, setShowSideEffectForm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sideEffectDescription, setSideEffectDescription] = useState("");
  const [sideEffectSeverity, setSideEffectSeverity] = useState<"mild" | "moderate" | "severe">("mild");
  const [sideEffectPhotos, setSideEffectPhotos] = useState<string[]>([]);

  // State for admin viewing another practitioner's session
  const [selectedPraticienId, setSelectedPraticienId] = useState<string | null>(null);
  const selectedSession = selectedPraticienId ? getSession(selectedPraticienId) : null;

  // Helper to calculate elapsed seconds for any session
  const calculateSessionElapsed = (session: typeof activeSession) => {
    if (!session) return 0;
    let elapsed = Date.now() - session.startedAt - session.totalPausedTime;
    if (session.isPaused && session.pausedAt) {
      elapsed -= (Date.now() - session.pausedAt);
    }
    return Math.floor(elapsed / 1000);
  };

  // Timer update effect for current user's session OR selected session
  useEffect(() => {
    const targetSession = activeSession || selectedSession;
    const targetPraticienId = activeSession ? user?.id : selectedPraticienId;
    if (!targetSession || !targetPraticienId) return;

    const updateTimer = () => {
      setDisplaySeconds(calculateSessionElapsed(targetSession));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession, selectedSession, user, selectedPraticienId]);

  // Timer update effect for other sessions (admin view)
  // Use activeSessions from store directly to avoid re-render loops
  const activeSessions = useSessionStore((s) => s.activeSessions);

  useEffect(() => {
    if (!isAdmin) return;

    const sessions = Object.values(activeSessions);
    if (sessions.length === 0) return;

    const updateOtherTimers = () => {
      const times: Record<string, number> = {};
      sessions.forEach((session) => {
        times[session.praticienId] = calculateSessionElapsed(session);
      });
      setOtherSessionsTimes(times);
    };

    updateOtherTimers();
    const interval = setInterval(updateOtherTimers, 1000);
    return () => clearInterval(interval);
  }, [isAdmin, activeSessions]);

  // Prevent screen lock during active session
  useEffect(() => {
    if (!activeSession) return;

    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch (err) {
        console.log("Wake lock not supported");
      }
    };

    requestWakeLock();
    return () => { wakeLock?.release(); };
  }, [activeSession]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle pause toggle - works for own session or selected session
  const handleTogglePause = () => {
    const targetPraticienId = activeSession ? user?.id : selectedPraticienId;
    if (!targetPraticienId) return;
    haptics.medium();
    togglePause(targetPraticienId);
  };

  // Handle photo capture
  const handleTakePhoto = () => {
    haptics.medium();
    setCameraOpen(true);
  };

  const handlePhotoCapture = async (imageData: string) => {
    const targetPraticienId = activeSession ? user?.id : selectedPraticienId;
    if (!targetPraticienId) return;

    setUploadingPhoto(true);
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Upload immediately to backend
      const result = await api.uploadTempPhoto(blob);
      addPhoto(targetPraticienId, { id: result.id, url: result.url });
      toast({ title: "Photo ajoutee" });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de telecharger la photo." });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle side effect photo capture
  const handleSideEffectPhotoCapture = (imageData: string) => {
    setSideEffectPhotos((prev) => [...prev, imageData]);
    toast({
      title: "Photo effet secondaire ajoutee",
    });
  };

  // Handle adding side effect
  const handleAddSideEffect = () => {
    const targetPraticienId = activeSession ? user?.id : selectedPraticienId;
    if (!targetPraticienId || !sideEffectDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Description requise",
        description: "Veuillez decrire l'effet secondaire.",
      });
      return;
    }

    addSideEffect(targetPraticienId, {
      description: sideEffectDescription,
      severity: sideEffectSeverity,
      photos: sideEffectPhotos,
    });

    // Reset form
    setSideEffectDescription("");
    setSideEffectSeverity("mild");
    setSideEffectPhotos([]);
    setShowSideEffectForm(false);

    toast({
      title: "Effet secondaire enregistre",
      description: "L'effet secondaire a ete ajoute a la seance.",
    });
  };

  // Handle end session
  const handleEndClick = () => {
    haptics.heavy();
    setShowEndConfirm(true);
  };

  const handleConfirmEnd = async () => {
    const targetSession = activeSession || selectedSession;
    const targetPraticienId = activeSession ? user?.id : selectedPraticienId;
    if (!targetSession || !targetPraticienId) return;

    setIsSaving(true);

    try {
      // Get final session data
      const result = endSession(targetPraticienId);
      if (!result) {
        setIsSaving(false);
        return;
      }

      const { session, durationSeconds } = result;

      // Prepare form data for API
      const formData = new FormData();
      formData.append("patient_zone_id", session.patientZoneId);
      formData.append("type_laser", session.typeLaser);
      formData.append("duree_minutes", Math.ceil(durationSeconds / 60).toString());

      if (session.fluence) formData.append("fluence", session.fluence);
      if (session.spotSize) formData.append("spot_size", session.spotSize);
      if (session.frequence) formData.append("frequence", session.frequence);
      if (session.tolerance) formData.append("tolerance", session.tolerance);
      if (session.effetsImmediats) formData.append("effets_immediats", session.effetsImmediats);

      // Combine session notes with end notes
      const allNotes = [session.notes, endNotes].filter(Boolean).join("\n\n");
      if (allNotes) formData.append("observations", allNotes);

      // Append photo IDs (already uploaded as temp photos)
      const photoIds = session.photos.map((p) => p.id);
      if (photoIds.length > 0) {
        formData.append("photo_ids", JSON.stringify(photoIds));
      }

      // Save to API
      await api.createSession(session.patientId, formData);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["patient", session.patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-sessions", session.patientId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast({
        title: "Séance terminée",
        description: `Séance de ${formatTime(durationSeconds)} enregistrée.`,
      });

      // Reset state and navigate
      setShowEndConfirm(false);
      setEndNotes("");

      // Check for pending zones in the queue
      const nextZone = popNextZone(targetPraticienId);
      if (nextZone && !selectedPraticienId) {
        // Auto-start next zone session
        const praticienName = session.praticienName;
        startSession(targetPraticienId, praticienName, {
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
        });
        toast({
          title: "Zone suivante",
          description: `Seance demarree pour ${nextZone.zoneName}`,
        });
        return;
      }

      if (selectedPraticienId) {
        // Admin ended another's session - stay on page
        setSelectedPraticienId(null);
      } else {
        // Ended own session - go to patient
        router.push(`/patients/${session.patientId}`);
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer la séance.",
      });
      setIsSaving(false);
    }
  };

  // Show loading while hydrating from localStorage
  if (!hasHydrated) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="h-8 w-48 skeleton rounded" />
        <Card>
          <CardContent className="p-6">
            <div className="h-16 w-32 skeleton rounded mx-auto mb-4" />
            <div className="h-4 w-24 skeleton rounded mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine if we have a session to display (own or selected)
  const displaySession = activeSession || selectedSession;

  // No active session for current user AND no selected session - show all sessions list
  if (!displaySession) {
    // Sessions to display - admins see all, practitioners see none
    const sessionsToShow = isAdmin ? allSessions : [];

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <h1 className="heading-2">Seances en cours</h1>

          {sessionsToShow.length > 0 ? (
            <div className="space-y-3">
              {sessionsToShow.map((session) => (
                <Card
                  key={session.praticienId}
                  className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    haptics.selection();
                    setSelectedPraticienId(session.praticienId);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Status indicator */}
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        session.isPaused ? "bg-yellow-500" : "bg-green-500 animate-pulse"
                      )} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{session.patientName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {session.zoneName} • {session.typeLaser}
                        </p>
                      </div>

                      {/* Timer */}
                      <div className={cn(
                        "font-mono text-xl font-semibold tabular-nums",
                        session.isPaused ? "text-yellow-600" : "text-green-600"
                      )}>
                        {formatTime(otherSessionsTimes[session.praticienId] || 0)}
                      </div>

                      {/* Practitioner */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{session.praticienName}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.isPaused ? "En pause" : "En cours"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="Aucune seance active"
              description="Demarrez une seance depuis le dossier d'un patient"
              action={{ label: "Voir les patients", href: "/patients" }}
            />
          )}

          {/* Action button */}
          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={() => router.push("/patients")}
          >
            <User className="h-5 w-5 mr-2" />
            Demarrer une seance
          </Button>
      </div>
    );
  }

  // End confirmation view
  if (showEndConfirm) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Camera capture dialog */}
        <CameraCapture
          open={cameraOpen}
          onOpenChange={setCameraOpen}
          onCapture={handlePhotoCapture}
        />

        {/* Header */}
        <h1 className="heading-2">Terminer la seance</h1>

        {/* Content */}
        <div className="space-y-4">
          {/* Summary */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <p className="text-4xl font-mono font-bold text-primary">
                  {formatTime(displaySeconds)}
                </p>
                <p className="text-muted-foreground">Durée de la séance</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center border-t pt-4">
                <div>
                  <p className="font-semibold">{displaySession.patientName}</p>
                  <p className="text-sm text-muted-foreground">Patient</p>
                </div>
                <div>
                  <p className="font-semibold">{displaySession.zoneName}</p>
                  <p className="text-sm text-muted-foreground">Zone</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Photos</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTakePhoto}
                disabled={isSaving}
              >
                <Camera className="h-4 w-4 mr-2" />
                Prendre une photo
              </Button>
            </div>
            {displaySession.photos.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {displaySession.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-xl overflow-hidden bg-muted relative group"
                  >
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed rounded-xl text-center text-muted-foreground">
                <Camera className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune photo</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Notes finales (optionnel)</label>
            <textarea
              value={endNotes}
              onChange={(e) => setEndNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border-2 border-border p-4 text-base resize-none focus:border-primary focus:outline-none"
              placeholder="Observations, tolérance, recommandations..."
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-14"
            onClick={() => setShowEndConfirm(false)}
            disabled={isSaving}
          >
            Continuer
          </Button>
          <Button
            className="flex-1 h-14"
            onClick={handleConfirmEnd}
            disabled={isSaving}
          >
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    );
  }

  // Active session view (own or selected)
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Camera capture dialog */}
      <CameraCapture
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={handlePhotoCapture}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Back button - only for selected session (admin viewing another's) */}
        {selectedPraticienId ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPraticienId(null)}
          >
            ← Retour
          </Button>
        ) : (
          <h1 className="heading-2">Seance active</h1>
        )}

        <span
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold",
            displaySession.isPaused
              ? "bg-yellow-500/20 text-yellow-600"
              : "bg-green-500/20 text-green-600"
          )}
        >
          {displaySession.isPaused ? "En pause" : "En cours"}
        </span>

        {/* Show practitioner name if viewing another's session */}
        {selectedPraticienId && (
          <span className="text-sm text-muted-foreground">
            {displaySession.praticienName}
          </span>
        )}
      </div>

      {/* Timer Card */}
      <Card>
        <CardContent className="p-6">
          {/* Timer - Large and readable from distance */}
          <div
            className={cn(
              "text-6xl sm:text-7xl font-mono font-bold mb-4 transition-colors text-center",
              displaySession.isPaused ? "text-yellow-500" : "text-foreground"
            )}
          >
            {formatTime(displaySeconds)}
          </div>

          {/* Patient & Zone Info */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{displaySession.patientName}</h2>
            <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
              <Target className="h-5 w-5" />
              <span>{displaySession.zoneName}</span>
              <span className="text-primary font-semibold">
                ({displaySession.sessionNumber}/{displaySession.totalSessions})
              </span>
            </div>
          </div>

          {/* Pause/Resume Button */}
          <div className="flex justify-center mt-6">
            <Button
              size="lg"
              variant={displaySession.isPaused ? "default" : "outline"}
              className="h-16 w-16 rounded-full"
              onClick={handleTogglePause}
              aria-label={displaySession.isPaused ? "Reprendre" : "Mettre en pause"}
            >
              {displaySession.isPaused ? (
                <Play className="h-8 w-8" />
              ) : (
                <Pause className="h-8 w-8" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Optiskin Parameters Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Laser</p>
              <p className="font-semibold">{displaySession.typeLaser}</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Spot</p>
              <p className="font-semibold">{displaySession.spotSize || "-"}</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Fluence J/cm2</p>
              <p className="font-semibold">{displaySession.fluence || "-"}</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Temps MS</p>
              <p className="font-semibold">{displaySession.pulseDurationMs || "-"}</p>
            </div>
            {displaySession.frequencyHz && (
              <div className="p-2 bg-muted/50 rounded-xl col-span-2 sm:col-span-4">
                <p className="text-xs text-muted-foreground">Frequence Hz</p>
                <p className="font-semibold">{displaySession.frequencyHz}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Zones Queue */}
      {(() => {
        const targetPid = activeSession ? user?.id : selectedPraticienId;
        const remaining = targetPid ? (pendingZones[targetPid] || []) : [];
        if (remaining.length === 0) return null;
        return (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">
                Zones suivantes ({remaining.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {remaining.map((zone, i) => (
                  <span
                    key={zone.patientZoneId}
                    className="px-3 py-1.5 rounded-lg text-sm bg-muted font-medium"
                  >
                    {i + 1}. {zone.zoneName}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Side Effects */}
      {displaySession.sideEffects && displaySession.sideEffects.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Effets secondaires ({displaySession.sideEffects.length})</span>
            </div>
            <div className="space-y-2">
              {displaySession.sideEffects.map((effect, i) => (
                <div key={i} className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm">
                  <p className="font-medium">{effect.description}</p>
                  {effect.severity && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded mt-1 inline-block",
                      effect.severity === "severe" ? "bg-destructive/20 text-destructive" :
                      effect.severity === "moderate" ? "bg-yellow-500/20 text-yellow-700" :
                      "bg-green-500/20 text-green-700"
                    )}>
                      {effect.severity === "severe" ? "Severe" : effect.severity === "moderate" ? "Modere" : "Leger"}
                    </span>
                  )}
                  {effect.photos.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {effect.photos.map((photo, j) => (
                        <img key={j} src={photo} alt="" className="h-10 w-10 object-cover rounded-xl" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Practitioners' Sessions - only show when viewing own session */}
      {!selectedPraticienId && otherSessions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Autres seances en cours ({otherSessions.length})
              </span>
            </div>
            <div className="space-y-2">
              {otherSessions.map((session) => (
                <div key={session.praticienId} className="p-3 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      session.isPaused ? "bg-yellow-500" : "bg-green-500 animate-pulse"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.patientName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.zoneName} • {session.praticienName}
                      </p>
                    </div>
                    <span className={cn(
                      "font-mono text-sm font-semibold tabular-nums shrink-0",
                      session.isPaused ? "text-yellow-600" : "text-green-600"
                    )}>
                      {formatTime(otherSessionsTimes[session.praticienId] || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Side Effect Form Modal */}
      {showSideEffectForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full rounded-t-2xl p-4 safe-area-bottom max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Ajouter un effet secondaire
            </h2>

              {/* Description */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Description *</label>
                <textarea
                  value={sideEffectDescription}
                  onChange={(e) => setSideEffectDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border-2 border-border p-3 text-base resize-none focus:border-primary focus:outline-none"
                  placeholder="Decrivez l'effet secondaire observe..."
                />
              </div>

              {/* Severity */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Severite</label>
                <div className="flex gap-2">
                  {[
                    { value: "mild", label: "Leger", color: "bg-green-500/20 text-green-700 border-green-500/30" },
                    { value: "moderate", label: "Modere", color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30" },
                    { value: "severe", label: "Severe", color: "bg-destructive/20 text-destructive border-destructive/30" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSideEffectSeverity(s.value as "mild" | "moderate" | "severe")}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all",
                        sideEffectSeverity === s.value ? s.color : "border-border hover:border-primary/50"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Photos</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSideEffectCameraOpen(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                {sideEffectPhotos.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {sideEffectPhotos.map((photo, i) => (
                      <div key={i} className="relative">
                        <img src={photo} alt="" className="h-16 w-16 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setSideEffectPhotos((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-xs flex items-center justify-center"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed rounded-xl text-center text-muted-foreground">
                    <Camera className="h-5 w-5 mx-auto mb-1 opacity-50" />
                    <p className="text-sm">Aucune photo</p>
                  </div>
                )}
              </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => {
                  setShowSideEffectForm(false);
                  setSideEffectDescription("");
                  setSideEffectPhotos([]);
                }}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 h-12"
                onClick={handleAddSideEffect}
                disabled={!sideEffectDescription.trim()}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Side Effect Camera Capture */}
      <CameraCapture
        open={sideEffectCameraOpen}
        onOpenChange={setSideEffectCameraOpen}
        onCapture={handleSideEffectPhotoCapture}
      />

      {/* Bottom Actions - THUMB ZONE */}
      <div className="flex flex-wrap gap-2 pb-24">
        {/* Photo */}
        <Button
          variant="outline"
          className="flex-1 h-14 rounded-xl relative"
          onClick={handleTakePhoto}
          disabled={uploadingPhoto}
          aria-label="Prendre une photo"
        >
          <Camera className="h-5 w-5 mr-1" />
          {uploadingPhoto ? "Envoi..." : "Photo"}
          {displaySession.photos.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-semibold">
              {displaySession.photos.length}
            </span>
          )}
        </Button>

        {/* Side Effect */}
        <Button
          variant="outline"
          className="flex-1 h-14 rounded-xl relative"
          onClick={() => setShowSideEffectForm(true)}
          aria-label="Signaler un effet secondaire"
        >
          <AlertTriangle className="h-5 w-5 mr-1" />
          Effet
          {displaySession.sideEffects && displaySession.sideEffects.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 text-white rounded-full text-xs flex items-center justify-center font-semibold">
              {displaySession.sideEffects.length}
            </span>
          )}
        </Button>

        {/* End Session */}
        <Button
          variant="destructive"
          className="flex-1 h-14 rounded-xl font-semibold"
          onClick={handleEndClick}
          aria-label="Terminer la seance"
        >
          <StopCircle className="h-5 w-5 mr-1" />
          Terminer
        </Button>
      </div>
    </div>
  );
}
