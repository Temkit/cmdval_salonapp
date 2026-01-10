"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { Check } from "lucide-react";

export interface Zone {
  id: string;
  code: string;
  nom: string;
  description?: string;
}

interface BodyZone {
  id: string;
  code: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Body zone positions (percentages relative to SVG viewBox)
const BODY_ZONES: BodyZone[] = [
  { id: "visage", code: "VISAGE", label: "Visage", x: 42, y: 2, width: 16, height: 10 },
  { id: "levre", code: "LEVRE", label: "Lèvre", x: 46, y: 7, width: 8, height: 3 },
  { id: "menton", code: "MENTON", label: "Menton", x: 45, y: 10, width: 10, height: 3 },
  { id: "cou", code: "COU", label: "Cou", x: 44, y: 13, width: 12, height: 4 },
  { id: "aisselles", code: "AISSELLES", label: "Aisselles", x: 28, y: 20, width: 8, height: 6 },
  { id: "aisselles-r", code: "AISSELLES", label: "Aisselles", x: 64, y: 20, width: 8, height: 6 },
  { id: "bras", code: "BRAS", label: "Bras", x: 20, y: 22, width: 10, height: 18 },
  { id: "bras-r", code: "BRAS", label: "Bras", x: 70, y: 22, width: 10, height: 18 },
  { id: "avant-bras", code: "AVBRAS", label: "Avant-bras", x: 15, y: 38, width: 10, height: 15 },
  { id: "avant-bras-r", code: "AVBRAS", label: "Avant-bras", x: 75, y: 38, width: 10, height: 15 },
  { id: "torse", code: "TORSE", label: "Torse", x: 38, y: 18, width: 24, height: 18 },
  { id: "ventre", code: "VENTRE", label: "Ventre", x: 40, y: 36, width: 20, height: 12 },
  { id: "maillot", code: "MAILLOT", label: "Maillot", x: 42, y: 48, width: 16, height: 8 },
  { id: "cuisses", code: "CUISSES", label: "Cuisses", x: 32, y: 52, width: 14, height: 20 },
  { id: "cuisses-r", code: "CUISSES", label: "Cuisses", x: 54, y: 52, width: 14, height: 20 },
  { id: "jambes", code: "JAMBES", label: "Jambes", x: 33, y: 72, width: 12, height: 20 },
  { id: "jambes-r", code: "JAMBES", label: "Jambes", x: 55, y: 72, width: 12, height: 20 },
];

interface BodyMapProps {
  zones: Zone[];
  selectedZoneIds?: string[];
  patientZones?: { zone_id: string; seances_effectuees: number; seances_prevues: number }[];
  onSelectZone: (zone: Zone) => void;
  mode?: "select" | "view";
}

export function BodyMap({
  zones,
  selectedZoneIds = [],
  patientZones = [],
  onSelectZone,
  mode = "select",
}: BodyMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Map zone codes to zone data
  const zoneMap = new Map<string, Zone>();
  zones.forEach((z) => {
    zoneMap.set(z.code.toUpperCase(), z);
  });

  // Get patient zone info
  const getPatientZoneInfo = (zoneId: string) => {
    return patientZones.find((pz) => pz.zone_id === zoneId);
  };

  const handleZoneClick = (bodyZone: BodyZone) => {
    const zone = zoneMap.get(bodyZone.code);
    if (zone) {
      haptics.selection();
      onSelectZone(zone);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* SVG Body Silhouette */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-auto"
        style={{ minHeight: "400px" }}
      >
        {/* Body silhouette background */}
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--muted))" />
            <stop offset="100%" stopColor="hsl(var(--muted) / 0.5)" />
          </linearGradient>
        </defs>

        {/* Simplified body shape */}
        <path
          d="M50 2 C58 2 62 8 62 12 L62 14 C68 16 72 22 72 28 L80 38 C82 42 80 48 76 50 L70 52 L70 48 L64 48 L64 56 C64 58 62 60 60 60 L60 72 L62 92 C62 96 58 98 54 98 L46 98 C42 98 38 96 38 92 L40 72 L40 60 C38 60 36 58 36 56 L36 48 L30 48 L30 52 L24 50 C20 48 18 42 20 38 L28 28 C28 22 32 16 38 14 L38 12 C38 8 42 2 50 2 Z"
          fill="url(#bodyGradient)"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
        />

        {/* Clickable zones */}
        {BODY_ZONES.map((bodyZone) => {
          const zone = zoneMap.get(bodyZone.code);
          if (!zone) return null;

          const isSelected = selectedZoneIds.includes(zone.id);
          const isHovered = hoveredZone === bodyZone.id;
          const patientZoneInfo = getPatientZoneInfo(zone.id);
          const hasPatientZone = !!patientZoneInfo;

          return (
            <g key={bodyZone.id}>
              <rect
                x={bodyZone.x}
                y={bodyZone.y}
                width={bodyZone.width}
                height={bodyZone.height}
                rx="2"
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  mode === "select" && "hover:opacity-100"
                )}
                fill={
                  isSelected
                    ? "hsl(var(--primary) / 0.6)"
                    : hasPatientZone
                    ? "hsl(var(--primary) / 0.3)"
                    : isHovered
                    ? "hsl(var(--primary) / 0.2)"
                    : "transparent"
                }
                stroke={
                  isSelected || hasPatientZone
                    ? "hsl(var(--primary))"
                    : isHovered
                    ? "hsl(var(--primary) / 0.5)"
                    : "transparent"
                }
                strokeWidth={isSelected ? "1" : "0.5"}
                onClick={() => handleZoneClick(bodyZone)}
                onMouseEnter={() => setHoveredZone(bodyZone.id)}
                onMouseLeave={() => setHoveredZone(null)}
              />

              {/* Session counter badge */}
              {hasPatientZone && (
                <g>
                  <circle
                    cx={bodyZone.x + bodyZone.width - 2}
                    cy={bodyZone.y + 2}
                    r="3"
                    fill="hsl(var(--primary))"
                  />
                  <text
                    x={bodyZone.x + bodyZone.width - 2}
                    y={bodyZone.y + 3}
                    fontSize="2.5"
                    fill="white"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {patientZoneInfo.seances_effectuees}/{patientZoneInfo.seances_prevues}
                  </text>
                </g>
              )}

              {/* Checkmark for selected */}
              {isSelected && (
                <circle
                  cx={bodyZone.x + bodyZone.width / 2}
                  cy={bodyZone.y + bodyZone.height / 2}
                  r="4"
                  fill="hsl(var(--primary))"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Zone Legend */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {zones.slice(0, 8).map((zone) => {
          const isSelected = selectedZoneIds.includes(zone.id);
          const patientZoneInfo = getPatientZoneInfo(zone.id);

          return (
            <button
              key={zone.id}
              onClick={() => {
                haptics.selection();
                onSelectZone(zone);
              }}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                "hover:border-primary/50 active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{zone.nom}</p>
                {patientZoneInfo && (
                  <p className="text-xs text-primary">
                    {patientZoneInfo.seances_effectuees}/{patientZoneInfo.seances_prevues} séances
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hovered zone tooltip */}
      {hoveredZone && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium shadow-lg">
          {BODY_ZONES.find((z) => z.id === hoveredZone)?.label}
        </div>
      )}
    </div>
  );
}
