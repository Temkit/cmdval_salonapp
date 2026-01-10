"use client";

import { useState, useCallback } from "react";
import {
  X,
  Check,
  Camera,
  Mic,
  Clock,
  AlertTriangle,
  Image,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { PhotoCapture } from "./photo-capture";
import { VoiceNotes } from "./voice-notes";

interface EndSessionData {
  notes: string;
  photos: string[];
  duration: number;
}

interface EndSessionSheetProps {
  patientName: string;
  zoneName: string;
  sessionNumber: number;
  totalSessions: number;
  elapsedSeconds: number;
  onConfirm: (data: EndSessionData) => void;
  onCancel: () => void;
}

// Quick note templates
const NOTE_TEMPLATES = [
  { label: "RAS", value: "RAS" },
  { label: "Légère rougeur", value: "Légère rougeur post-traitement" },
  { label: "Bonne tolérance", value: "Bonne tolérance du patient" },
  { label: "Pigmentation", value: "Pigmentation notée, à surveiller" },
  { label: "Sensible", value: "Zone sensible, patient a ressenti une gêne" },
  { label: "Paramètres ajustés", value: "Paramètres ajustés en cours de séance" },
];

export function EndSessionSheet({
  patientName,
  zoneName,
  sessionNumber,
  totalSessions,
  elapsedSeconds,
  onConfirm,
  onCancel,
}: EndSessionSheetProps) {
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLastSession = sessionNumber >= totalSessions;

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Add photo
  const handlePhotoCapture = useCallback((imageData: string) => {
    setPhotos((prev) => [...prev, imageData]);
    setShowCamera(false);
    haptics.success();
  }, []);

  // Remove photo
  const removePhoto = useCallback((index: number) => {
    haptics.light();
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Apply template
  const applyTemplate = useCallback((value: string) => {
    haptics.selection();
    setNotes((prev) => (prev ? `${prev}\n${value}` : value));
  }, []);

  // Handle voice transcript
  const handleVoiceTranscript = useCallback((text: string) => {
    setNotes(text);
  }, []);

  // Confirm and submit
  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);
    haptics.success();

    await onConfirm({
      notes,
      photos,
      duration: elapsedSeconds,
    });

    setIsSubmitting(false);
  }, [notes, photos, elapsedSeconds, onConfirm]);

  // Cancel
  const handleCancel = useCallback(() => {
    haptics.light();
    onCancel();
  }, [onCancel]);

  // Show camera view
  if (showCamera) {
    return (
      <PhotoCapture
        onCapture={handlePhotoCapture}
        onClose={() => setShowCamera(false)}
        label="Photo post-traitement"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="sticky top-0 bg-background pt-3 pb-2 z-10">
          <div className="w-12 h-1.5 rounded-full bg-muted mx-auto" />
        </div>

        <div className="px-6 pb-6 safe-area-bottom">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-1">Terminer la séance</h2>
            <p className="text-muted-foreground">
              {patientName} • {zoneName}
            </p>
          </div>

          {/* Duration Summary */}
          <Card className="mb-4">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Durée totale</span>
              </div>
              <span className="text-2xl font-mono font-bold">
                {formatTime(elapsedSeconds)}
              </span>
            </CardContent>
          </Card>

          {/* Last session warning */}
          {isLastSession && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm">
                C'est la dernière séance prévue pour cette zone.
              </p>
            </div>
          )}

          {/* Photos Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Photos</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {/* Add more button */}
                <button
                  onClick={() => setShowCamera(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCamera(true)}
                className="w-full h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Prendre une photo
                </span>
              </button>
            )}
          </div>

          {/* Notes Section */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              Notes (optionnel)
            </label>

            {/* Voice input toggle */}
            {showVoice ? (
              <div className="mb-3">
                <VoiceNotes
                  onTranscript={handleVoiceTranscript}
                  placeholder="Dictez vos notes..."
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoice(false)}
                  className="w-full mt-2"
                >
                  Masquer la dictée vocale
                </Button>
              </div>
            ) : (
              <div className="relative mb-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="RAS, observations, réactions..."
                  className="w-full h-28 p-4 pr-14 bg-muted rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => setShowVoice(true)}
                  className="absolute bottom-3 right-3 p-3 rounded-full bg-background hover:bg-primary/10 transition-colors"
                  type="button"
                >
                  <Mic className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Quick templates */}
            <div className="flex flex-wrap gap-2">
              {NOTE_TEMPLATES.map((template) => (
                <Button
                  key={template.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template.value)}
                  className="rounded-full"
                >
                  {template.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-14"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 h-14"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Enregistrement..."
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Confirmer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
