import { Check, FileText, ShieldCheck, UserPlus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "preconsult", label: "Pre-consultation", icon: FileText },
  { key: "validation", label: "Validation", icon: ShieldCheck },
  { key: "patient", label: "Dossier patient", icon: UserPlus },
  { key: "sessions", label: "Seances", icon: Zap },
] as const;

export type WorkflowPhase = (typeof STEPS)[number]["key"];

interface PatientWorkflowStepperProps {
  current: WorkflowPhase;
  className?: string;
}

export function PatientWorkflowStepper({ current, className }: PatientWorkflowStepperProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <nav className={cn("w-full", className)} aria-label="Progression">
      {/* Desktop */}
      <ol className="hidden sm:flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const Icon = done ? Check : step.icon;
          return (
            <li key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                    done && "bg-primary text-primary-foreground",
                    active && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    active && "text-primary",
                    done && "text-foreground",
                    !done && !active && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3 rounded-full transition-colors",
                    i < currentIdx ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile - compact */}
      <div className="sm:hidden">
        <div className="flex items-center gap-1.5 justify-center">
          {STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step.key} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                    done && "bg-primary text-primary-foreground",
                    active && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-6 h-0.5 rounded-full",
                      i < currentIdx ? "bg-primary" : "bg-muted",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs font-medium text-primary mt-2">
          {STEPS[currentIdx]?.label ?? ""}
        </p>
      </div>
    </nav>
  );
}

/** Map a pre-consultation status to a workflow phase */
export function statusToPhase(status: string): WorkflowPhase {
  switch (status) {
    case "draft":
    case "rejected":
      return "preconsult";
    case "pending_validation":
      return "validation";
    case "validated":
      return "patient";
    default:
      return "preconsult";
  }
}
