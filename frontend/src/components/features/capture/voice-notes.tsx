"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface VoiceNotesProps {
  onTranscript: (text: string) => void;
  className?: string;
  placeholder?: string;
}

export function VoiceNotes({
  onTranscript,
  className,
  placeholder = "Appuyez pour dicter...",
}: VoiceNotesProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fr-FR";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        onTranscript(transcript + finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError("Permission microphone refusée");
      } else if (event.error === "no-speech") {
        // Ignore no-speech errors
      } else {
        setError("Erreur de reconnaissance vocale");
      }
      setIsRecording(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsProcessing(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    setError(null);
    setIsRecording(true);
    haptics.medium();

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsRecording(false);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    setIsProcessing(true);
    haptics.light();

    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error("Failed to stop recording:", err);
    }
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript("");
    onTranscript("");
    haptics.light();
  }, [onTranscript]);

  if (!isSupported) {
    return (
      <div className={cn("text-center text-sm text-muted-foreground p-4", className)}>
        La reconnaissance vocale n'est pas supportée par ce navigateur.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Recording button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={isRecording ? "destructive" : "outline"}
          size="lg"
          className={cn(
            "h-14 flex-1 transition-all",
            isRecording && "animate-pulse"
          )}
          onClick={toggleRecording}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Traitement...
            </>
          ) : isRecording ? (
            <>
              <Square className="h-5 w-5 mr-2" />
              Arrêter l'enregistrement
            </>
          ) : (
            <>
              <Mic className="h-5 w-5 mr-2" />
              {placeholder}
            </>
          )}
        </Button>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 text-destructive">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium">Enregistrement en cours...</span>
        </div>
      )}

      {/* Transcript display */}
      {transcript && (
        <div className="relative">
          <div className="p-4 bg-muted rounded-xl text-sm">
            {transcript}
          </div>
          <button
            type="button"
            onClick={clearTranscript}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50"
          >
            <MicOff className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}

// Simple hook for voice input
export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "fr-FR";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        setTranscript((prev) => prev + result[0].transcript + " ");
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (recognitionRef.current) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const clear = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isRecording,
    transcript,
    start,
    stop,
    clear,
    setTranscript,
  };
}
