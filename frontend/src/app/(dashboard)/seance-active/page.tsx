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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { useSessionStore } from "@/stores/session-store";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CameraCapture } from "@/components/ui/camera-capture";

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
  const endSession = useSessionStore((s) => s.endSession);
  const getElapsedSeconds = useSessionStore((s) => s.getElapsedSeconds);

  // Get active session for current user (only after hydration)
  const activeSession = hasHydrated && user ? getSession(user.id) : null;
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

  const handlePhotoCapture = (imageData: string) => {
    const targetPraticienId = activeSession ? user?.id : selectedPraticienId;
    if (!targetPraticienId) return;
    addPhoto(targetPraticienId, imageData);
    toast({
      title: "Photo ajoutée",
      description: "La photo a été enregistrée.",
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

      // Convert base64 photos to files and append
      for (let i = 0; i < session.photos.length; i++) {
        const base64 = session.photos[i];
        const response = await fetch(base64);
        const blob = await response.blob();
        formData.append("photos", blob, `photo-${i + 1}.jpg`);
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
      if (selectedPraticienId) {
        // Admin ended another's session - stay on page
        setSelectedPraticienId(null);
      } else {
        // Ended own session - go to patient
        router.push(`/patients/${session.patientId}`);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la séance.",
      });
      setIsSaving(false);
    }
  };

  // Show loading while hydrating from localStorage
  if (!hasHydrated) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-muted animate-pulse mb-4" />
        <p className="text-muted-foreground">Chargement...</p>
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
      <div className="h-full flex flex-col p-6">
        <div className="max-w-lg mx-auto w-full">
          {/* Header */}
          <h1 className="text-2xl font-bold mb-6">Séances en cours</h1>

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
                        "font-mono text-lg font-semibold tabular-nums",
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
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Aucune séance active</h2>
              <p className="text-muted-foreground mb-8">
                Sélectionnez un patient et démarrez une séance.
              </p>
            </div>
          )}

          {/* Action button */}
          <div className="mt-8">
            <Button
              size="lg"
              className="w-full h-14 text-lg"
              onClick={() => router.push("/patients")}
            >
              <User className="h-5 w-5 mr-2" />
              Démarrer une séance
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // End confirmation view
  if (showEndConfirm) {
    return (
      <div className="h-full flex flex-col">
        {/* Camera capture dialog */}
        <CameraCapture
          open={cameraOpen}
          onOpenChange={setCameraOpen}
          onCapture={handlePhotoCapture}
        />

        {/* Header */}
        <div className="p-4 border-b safe-area-top">
          <h1 className="text-xl font-bold text-center">Terminer la séance</h1>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 max-w-lg mx-auto w-full overflow-y-auto">
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
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden bg-muted relative group"
                  >
                    <img
                      src={photo}
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
        <div className="p-4 border-t safe-area-bottom">
          <div className="flex gap-3 max-w-lg mx-auto">
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
      </div>
    );
  }

  // Active session view (own or selected)
  return (
    <div className="h-full flex flex-col">
      {/* Camera capture dialog */}
      <CameraCapture
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={handlePhotoCapture}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b safe-area-top">
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
          <div />
        )}

        <span
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold",
            displaySession.isPaused
              ? "bg-yellow-500/20 text-yellow-600"
              : "bg-green-500/20 text-green-600"
          )}
        >
          {displaySession.isPaused ? "En pause" : "En cours"}
        </span>

        {/* Show practitioner name if viewing another's session */}
        {selectedPraticienId ? (
          <span className="text-sm text-muted-foreground">
            {displaySession.praticienName}
          </span>
        ) : (
          <div />
        )}
      </div>

      {/* Main Content - Glanceable */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Timer - Large and readable from distance */}
        <div
          className={cn(
            "text-7xl sm:text-8xl font-mono font-bold mb-8 transition-colors",
            displaySession.isPaused ? "text-yellow-500" : "text-foreground"
          )}
        >
          {formatTime(displaySeconds)}
        </div>

        {/* Patient & Zone Info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{displaySession.patientName}</h1>
          <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
            <Target className="h-5 w-5" />
            <span>{displaySession.zoneName}</span>
            <span className="text-primary font-semibold">
              ({displaySession.sessionNumber}/{displaySession.totalSessions})
            </span>
          </div>
        </div>

        {/* Parameters Card */}
        <Card className="w-full max-w-sm mb-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Laser</p>
                <p className="font-semibold">{displaySession.typeLaser}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fluence</p>
                <p className="font-semibold">{displaySession.fluence || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spot</p>
                <p className="font-semibold">{displaySession.spotSize || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pause/Resume Button */}
        <Button
          size="lg"
          variant={displaySession.isPaused ? "default" : "outline"}
          className="h-20 w-20 rounded-full"
          onClick={handleTogglePause}
        >
          {displaySession.isPaused ? (
            <Play className="h-10 w-10" />
          ) : (
            <Pause className="h-10 w-10" />
          )}
        </Button>
      </div>

      {/* Other Practitioners' Sessions - only show when viewing own session */}
      {!selectedPraticienId && otherSessions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Autres séances en cours ({otherSessions.length})
              </span>
            </div>
            <div className="space-y-2">
              {otherSessions.map((session) => (
                <Card key={session.praticienId} className="overflow-hidden">
                  <CardContent className="p-3">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions - THUMB ZONE */}
      <div className="p-4 border-t safe-area-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          {/* Photo */}
          <Button
            variant="outline"
            className="flex-1 h-16 rounded-xl relative"
            onClick={handleTakePhoto}
          >
            <Camera className="h-6 w-6 mr-2" />
            Photo
            {displaySession.photos.length > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-semibold">
                {displaySession.photos.length}
              </span>
            )}
          </Button>

          {/* End Session */}
          <Button
            variant="destructive"
            className="flex-1 h-16 rounded-xl text-lg font-semibold"
            onClick={handleEndClick}
          >
            <StopCircle className="h-6 w-6 mr-2" />
            Terminer
          </Button>
        </div>
      </div>
    </div>
  );
}
