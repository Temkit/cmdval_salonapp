"use client";

import { useEffect, useRef, useState } from "react";
import { X, Keyboard } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  isOpen: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
}

export function QRScanner({ isOpen, onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let scanner: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!scannerRef.current) return;

        scanner = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            scanner.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {
            // Ignore scan failures (continuous scanning)
          }
        );
        setError(null);
      } catch (err: any) {
        setError("Impossible d'acceder a la camera. Verifiez les permissions.");
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (code) {
      onScan(code);
      setManualCode("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white font-semibold">Scanner un code</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex items-center justify-center relative">
        {error ? (
          <div className="text-center px-6">
            <p className="text-white/80 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => setShowManualInput(true)}
              className="text-white border-white/30"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Entrer le code manuellement
            </Button>
          </div>
        ) : (
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full max-w-sm mx-auto"
          />
        )}
      </div>

      {/* Manual input fallback */}
      <div className="p-4 bg-black/80 safe-area-bottom">
        {showManualInput ? (
          <div className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Code carte patient..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            />
            <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>
              OK
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setShowManualInput(true)}
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Entrer le code manuellement
          </Button>
        )}
      </div>
    </div>
  );
}
