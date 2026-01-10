"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Pause,
  StopCircle,
  Camera,
  Mic,
  Clock,
  User,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { useSessionStore } from "@/stores/session-store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SeanceActivePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session store
  const activeSession = useSessionStore((s) => s.activeSession);
  const togglePause = useSessionStore((s) => s.togglePause);
  const addPhoto = useSessionStore((s) => s.addPhoto);
  const addNote = useSessionStore((s) => s.addNote);
  const endSession = useSessionStore((s) => s.endSession);
  const getElapsedSeconds = useSessionStore((s) => s.getElapsedSeconds);

  // Local state for timer display
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [endNotes, setEndNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Timer update effect
  useEffect(() => {
    if (!activeSession) return;

    const updateTimer = () => {
      setDisplaySeconds(getElapsedSeconds());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession, getElapsedSeconds]);

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

  // Handle pause toggle
  const handleTogglePause = () => {
    haptics.medium();
    togglePause();
  };

  // Handle photo capture
  const handleTakePhoto = () => {
    haptics.medium();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      addPhoto(reader.result as string);
      toast({
        title: "Photo ajoutée",
        description: "La photo a été enregistrée.",
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  // Handle end session
  const handleEndClick = () => {
    haptics.heavy();
    setShowEndConfirm(true);
  };

  const handleConfirmEnd = async () => {
    if (!activeSession) return;

    setIsSaving(true);

    try {
      // Get final session data
      const result = endSession();
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

      // Navigate back to patient
      router.push(`/patients/${session.patientId}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la séance.",
      });
      setIsSaving(false);
    }
  };

  // No active session view
  if (!activeSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pb-24">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Aucune séance active</h1>
          <p className="text-muted-foreground mb-8">
            Sélectionnez un patient et démarrez une séance pour suivre le traitement en temps réel.
          </p>
          <Button
            size="lg"
            className="w-full max-w-xs h-14 text-lg"
            onClick={() => router.push("/patients")}
          >
            <User className="h-5 w-5 mr-2" />
            Choisir un patient
          </Button>
        </div>
      </div>
    );
  }

  // End confirmation view
  if (showEndConfirm) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 border-b safe-area-top">
          <h1 className="text-xl font-bold text-center">Terminer la séance</h1>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 max-w-lg mx-auto w-full">
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
                  <p className="font-semibold">{activeSession.patientName}</p>
                  <p className="text-sm text-muted-foreground">Patient</p>
                </div>
                <div>
                  <p className="font-semibold">{activeSession.zoneName}</p>
                  <p className="text-sm text-muted-foreground">Zone</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos count */}
          {activeSession.photos.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-xl mb-4">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span>{activeSession.photos.length} photo(s) capturée(s)</span>
            </div>
          )}

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

  // Active session view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hidden file input for photo capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b safe-area-top">
        <span
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold",
            activeSession.isPaused
              ? "bg-yellow-500/20 text-yellow-600"
              : "bg-green-500/20 text-green-600"
          )}
        >
          {activeSession.isPaused ? "En pause" : "En cours"}
        </span>
      </div>

      {/* Main Content - Glanceable */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Timer - Large and readable from distance */}
        <div
          className={cn(
            "text-7xl sm:text-8xl font-mono font-bold mb-8 transition-colors",
            activeSession.isPaused ? "text-yellow-500" : "text-foreground"
          )}
        >
          {formatTime(displaySeconds)}
        </div>

        {/* Patient & Zone Info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{activeSession.patientName}</h1>
          <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
            <Target className="h-5 w-5" />
            <span>{activeSession.zoneName}</span>
            <span className="text-primary font-semibold">
              ({activeSession.sessionNumber}/{activeSession.totalSessions})
            </span>
          </div>
        </div>

        {/* Parameters Card */}
        <Card className="w-full max-w-sm mb-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Laser</p>
                <p className="font-semibold">{activeSession.typeLaser}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fluence</p>
                <p className="font-semibold">{activeSession.fluence || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spot</p>
                <p className="font-semibold">{activeSession.spotSize || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pause/Resume Button */}
        <Button
          size="lg"
          variant={activeSession.isPaused ? "default" : "outline"}
          className="h-20 w-20 rounded-full"
          onClick={handleTogglePause}
        >
          {activeSession.isPaused ? (
            <Play className="h-10 w-10" />
          ) : (
            <Pause className="h-10 w-10" />
          )}
        </Button>
      </div>

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
            {activeSession.photos.length > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-semibold">
                {activeSession.photos.length}
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
