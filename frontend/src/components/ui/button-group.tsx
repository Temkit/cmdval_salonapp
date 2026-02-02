"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonGroupOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface ButtonGroupProps {
  options: ButtonGroupOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function ButtonGroup({
  options,
  value,
  onChange,
  className,
  size = "md",
  columns = 2,
}: ButtonGroupProps) {
  const sizeClasses = {
    sm: "min-h-[44px] px-3 py-2 text-sm",
    md: "min-h-[56px] px-4 py-3 text-base",
    lg: "min-h-[72px] px-5 py-4 text-lg",
  };

  const colClasses = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };

  return (
    <div className={cn("grid gap-2", colClasses[columns], className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 font-medium transition-all active:scale-[0.98]",
            sizeClasses[size],
            value === option.value
              ? "border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary ring-offset-2 ring-offset-background"
              : "border-border bg-background hover:border-primary/50 hover:bg-muted"
          )}
        >
          {option.icon && <span className="mb-1">{option.icon}</span>}
          <span>{option.label}</span>
          {option.description && (
            <span className="text-xs opacity-70 mt-0.5">{option.description}</span>
          )}
        </button>
      ))}
    </div>
  );
}

interface NumberStepperProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  presets?: number[];
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  presets,
  className,
}: NumberStepperProps) {
  const numValue = parseFloat(value) || 0;

  const increment = () => {
    const newVal = Math.min(numValue + step, max);
    onChange(newVal.toString());
  };

  const decrement = () => {
    const newVal = Math.max(numValue - step, min);
    onChange(newVal.toString());
  };

  return (
    <div className={cn("space-y-2", className)}>
      {presets && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset.toString())}
              className={cn(
                "min-h-[44px] px-4 py-2 rounded-lg border-2 font-medium transition-all",
                numValue === preset
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/50"
              )}
            >
              {preset}{unit}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={numValue <= min}
          className="min-h-[56px] min-w-[56px] rounded-lg border-2 border-border bg-background text-2xl font-bold hover:bg-muted disabled:opacity-50 active:scale-95"
        >
          -
        </button>
        <div className="flex-1 min-h-[56px] flex items-center justify-center rounded-lg border-2 border-border bg-muted/50 text-xl font-semibold">
          {value || "0"}{unit && <span className="text-sm ml-1 opacity-70">{unit}</span>}
        </div>
        <button
          type="button"
          onClick={increment}
          disabled={numValue >= max}
          className="min-h-[56px] min-w-[56px] rounded-lg border-2 border-border bg-background text-2xl font-bold hover:bg-muted disabled:opacity-50 active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
}

interface ToggleButtonProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
  className?: string;
}

export function ToggleButton({
  value,
  onChange,
  trueLabel = "Oui",
  falseLabel = "Non",
  className,
}: ToggleButtonProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <button
        type="button"
        aria-pressed={value === true}
        onClick={() => onChange(true)}
        className={cn(
          "min-h-[56px] px-4 py-3 rounded-lg border-2 font-medium text-lg transition-all active:scale-[0.98]",
          value === true
            ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
            : "border-border bg-background hover:border-primary/50 hover:bg-muted"
        )}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        aria-pressed={value === false}
        onClick={() => onChange(false)}
        className={cn(
          "min-h-[56px] px-4 py-3 rounded-lg border-2 font-medium text-lg transition-all active:scale-[0.98]",
          value === false
            ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
            : "border-border bg-background hover:border-primary/50 hover:bg-muted"
        )}
      >
        {falseLabel}
      </button>
    </div>
  );
}

interface ZoneCardProps {
  zone: {
    id: string;
    zone_nom: string;
    seances_effectuees: number;
    seances_prevues: number;
    seances_restantes: number;
  };
  selected: boolean;
  onSelect: () => void;
}

export function ZoneCard({ zone, selected, onSelect }: ZoneCardProps) {
  const progress = (zone.seances_effectuees / zone.seances_prevues) * 100;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full min-h-[80px] p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98]",
        selected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-background hover:border-primary/50"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-lg">{zone.zone_nom}</span>
        <span className={cn(
          "text-sm font-medium px-2 py-0.5 rounded-full",
          zone.seances_restantes > 0
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500"
        )}>
          {zone.seances_restantes} restante{zone.seances_restantes !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {zone.seances_effectuees}/{zone.seances_prevues}
        </span>
      </div>
    </button>
  );
}
