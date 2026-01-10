"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, Check, FlipHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface PhotoCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  label?: string;
}

export function PhotoCapture({ onCapture, onClose, label = "Photo" }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // Start camera
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

  // Initialize camera
  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Take photo
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    haptics.medium();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(imageData);
  }, []);

  // Retake photo
  const retake = useCallback(() => {
    haptics.light();
    setCapturedImage(null);
  }, []);

  // Confirm photo
  const confirm = useCallback(() => {
    if (capturedImage) {
      haptics.success();
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  // Switch camera
  const switchCamera = useCallback(() => {
    haptics.selection();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setCapturedImage(null);
  }, []);

  // Close handler
  const handleClose = useCallback(() => {
    haptics.light();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    onClose();
  }, [stream, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 safe-area-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-white font-semibold text-lg">{label}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={switchCamera}
          className="text-white hover:bg-white/10"
          disabled={!!capturedImage}
        >
          <FlipHorizontal className="h-6 w-6" />
        </Button>
      </div>

      {/* Camera/Preview */}
      <div className="flex-1 relative">
        {/* Video stream */}
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            capturedImage && "hidden"
          )}
          playsInline
          muted
        />

        {/* Captured image preview */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading state */}
        {isLoading && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
            <div className="text-center">
              <Camera className="h-16 w-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/80 mb-4">{error}</p>
              <Button onClick={startCamera} variant="outline">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Grid overlay for alignment */}
        {!capturedImage && !error && !isLoading && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-white/20"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 safe-area-bottom">
        {!capturedImage ? (
          // Capture button
          <div className="flex justify-center">
            <button
              onClick={takePhoto}
              disabled={isLoading || !!error}
              className={cn(
                "w-20 h-20 rounded-full border-4 border-white flex items-center justify-center",
                "active:scale-95 transition-transform",
                "disabled:opacity-50"
              )}
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>
          </div>
        ) : (
          // Review buttons
          <div className="flex items-center justify-center gap-8">
            <Button
              variant="ghost"
              size="lg"
              onClick={retake}
              className="h-16 px-8 text-white hover:bg-white/10"
            >
              <RotateCcw className="h-6 w-6 mr-2" />
              Reprendre
            </Button>
            <Button
              size="lg"
              onClick={confirm}
              className="h-16 px-8"
            >
              <Check className="h-6 w-6 mr-2" />
              Valider
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
