"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageData: string) => void;
}

export function CameraCapture({ open, onOpenChange, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setError(null);
    }

    return () => {
      stopCamera();
    };
  }, [open, facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsReady(false);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        setError("Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres.");
      } else if (err.name === "NotFoundError") {
        setError("Aucune caméra trouvée sur cet appareil.");
      } else {
        setError("Impossible d'accéder à la caméra.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  };

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(imageData);
    }
  }, []);

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onOpenChange(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Prendre une photo</DialogTitle>
        </DialogHeader>

        <div className="relative aspect-[4/3] bg-black">
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div>
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-white">{error}</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={startCamera}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {!error && !isReady && !capturedImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-4 border-white/30 border-t-white animate-spin" />
            </div>
          )}

          {/* Video preview */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover",
              capturedImage && "hidden"
            )}
          />

          {/* Captured image preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          {/* Camera switch button */}
          {!capturedImage && isReady && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/70"
              onClick={toggleCamera}
            >
              <RotateCcw className="h-5 w-5 text-white" />
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 flex justify-center gap-4">
          {!capturedImage ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                size="lg"
                className="rounded-full h-16 w-16"
                onClick={takePhoto}
                disabled={!isReady}
              >
                <Camera className="h-6 w-6" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={retakePhoto}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reprendre
              </Button>
              <Button
                onClick={confirmPhoto}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Confirmer
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
