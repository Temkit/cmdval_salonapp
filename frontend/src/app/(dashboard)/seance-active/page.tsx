"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  StopCircle,
  Camera,
  Mic,
  Clock,
  User,
  MapPin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { EndSessionSheet } from "@/components/features/capture";

interface ActiveSession {
  id: string;
  patientId: string;
  patientName: string;
  zoneName: string;
  zoneId: string;
  sessionNumber: number;
  totalSessions: number;
  typeLaser: string;
  parameters: {
    fluence?: string;
    spotSize?: string;
    frequency?: string;
  };
  startedAt: Date;
  notes: string;
}

// Mock active session - in production this would come from global state/context
const mockSession: ActiveSession | null = null;

export default function SeanceActivePage() {
  const router = useRouter();
  const [session, setSession] = useState<ActiveSession | null>(mockSession);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEndSheet, setShowEndSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!session || isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, isPaused]);

  // Prevent screen lock during active session
  useEffect(() => {
    if (!session) return;

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

    return () => {
      wakeLock?.release();
    };
  }, [session]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle pause
  const togglePause = () => {
    haptics.medium();
    setIsPaused(!isPaused);
  };

  // End session
  const handleEndSession = () => {
    haptics.heavy();
    setShowEndSheet(true);
  };

  // Confirm end with session data
  const confirmEnd = async (data: { notes: string; photos: string[]; duration: number }) => {
    // Save session data - in production, send to API
    console.log("Session completed:", {
      sessionId: session?.id,
      ...data,
    });

    setSession(null);
    setShowEndSheet(false);
    router.push("/");
  };

  // Take photo
  const handleTakePhoto = () => {
    haptics.medium();
    // Open camera
  };

  // Voice note
  const handleVoiceNote = () => {
    haptics.medium();
    setIsRecording(!isRecording);
  };

  // No active session view
  if (!session) {
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

  // Active session view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="h-6 w-6" />
        </Button>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            isPaused
              ? "bg-yellow-500/20 text-yellow-600"
              : "bg-green-500/20 text-green-600"
          )}
        >
          {isPaused ? "En pause" : "En cours"}
        </span>
        <div className="w-10" />
      </div>

      {/* Main Content - Glanceable */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Timer - Large and readable from distance */}
        <div
          className={cn(
            "text-8xl font-mono font-bold mb-8 transition-colors",
            isPaused ? "text-yellow-500" : "text-foreground"
          )}
        >
          {formatTime(elapsedSeconds)}
        </div>

        {/* Patient & Zone Info */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{session.patientName}</h1>
          <div className="flex items-center justify-center gap-2 text-xl text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span>{session.zoneName}</span>
            <span className="text-primary font-semibold">
              ({session.sessionNumber}/{session.totalSessions})
            </span>
          </div>
        </div>

        {/* Parameters Card */}
        <Card className="w-full max-w-md mb-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Laser</p>
                <p className="font-semibold">{session.typeLaser}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fluence</p>
                <p className="font-semibold">{session.parameters.fluence || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spot</p>
                <p className="font-semibold">{session.parameters.spotSize || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pause/Resume Button */}
        <Button
          size="lg"
          variant={isPaused ? "default" : "outline"}
          className="h-16 w-16 rounded-full"
          onClick={togglePause}
        >
          {isPaused ? (
            <Play className="h-8 w-8" />
          ) : (
            <Pause className="h-8 w-8" />
          )}
        </Button>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t safe-area-bottom">
        <div className="flex gap-3 max-w-md mx-auto">
          {/* Quick Note */}
          <Button
            variant="outline"
            className={cn("flex-1 h-14", isRecording && "bg-red-500/20 border-red-500")}
            onClick={handleVoiceNote}
          >
            <Mic className={cn("h-5 w-5 mr-2", isRecording && "text-red-500 animate-pulse")} />
            {isRecording ? "Arrêter" : "Note"}
          </Button>

          {/* Photo */}
          <Button variant="outline" className="flex-1 h-14" onClick={handleTakePhoto}>
            <Camera className="h-5 w-5 mr-2" />
            Photo
          </Button>

          {/* End Session */}
          <Button
            variant="destructive"
            className="flex-1 h-14"
            onClick={handleEndSession}
          >
            <StopCircle className="h-5 w-5 mr-2" />
            Terminer
          </Button>
        </div>
      </div>

      {/* End Session Sheet */}
      {showEndSheet && session && (
        <EndSessionSheet
          patientName={session.patientName}
          zoneName={session.zoneName}
          sessionNumber={session.sessionNumber}
          totalSessions={session.totalSessions}
          elapsedSeconds={elapsedSeconds}
          onConfirm={confirmEnd}
          onCancel={() => setShowEndSheet(false)}
        />
      )}
    </div>
  );
}
