"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";
import { Spinner } from "./spinner";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface MultiStepFormProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
  onSubmit: () => void;
  isSubmitting?: boolean;
  canProceed?: boolean;
  submitLabel?: string;
  className?: string;
}

export function MultiStepForm({
  steps,
  currentStep,
  onStepChange,
  children,
  onSubmit,
  isSubmitting = false,
  canProceed = true,
  submitLabel = "Terminer",
  className,
}: MultiStepFormProps) {
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  const handleNext = () => {
    if (isLastStep) {
      onSubmit();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-3 px-2">
        <Progress value={progressPercent} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground tabular-nums">{progressPercent}%</span>
      </div>

      {/* Step indicator */}
      <nav aria-label="Progression" className="px-2">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-center",
                  index < steps.length - 1 && "flex-1"
                )}
              >
                <button
                  type="button"
                  onClick={() => index < currentStep && onStepChange(index)}
                  disabled={index > currentStep}
                  className={cn(
                    "flex items-center gap-2 group",
                    index <= currentStep
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {/* Step circle */}
                  <span
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors shrink-0",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "border-primary text-primary",
                      !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </span>

                  {/* Step label - hidden on small screens */}
                  <span
                    className={cn(
                      "hidden sm:block text-sm font-medium",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </button>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-3 sm:mx-4",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Current step title (mobile) */}
      <div className="sm:hidden text-center">
        <p className="text-sm text-muted-foreground">
          Étape {currentStep + 1} sur {steps.length}
        </p>
        <h2 className="heading-4 mt-1">{steps[currentStep].title}</h2>
        {steps[currentStep].description && (
          <p className="text-secondary mt-1">{steps[currentStep].description}</p>
        )}
      </div>

      {/* Step content */}
      <div className="min-h-[300px]" role="tabpanel" aria-label={steps[currentStep].title}>
        {children}
      </div>

      {/* Navigation buttons */}
      <div className="sticky bottom-4 flex gap-3 pt-4 bg-background/80 backdrop-blur-sm -mx-4 px-4 pb-4 sm:static sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0 sm:pb-0">
        {currentStep > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="flex-1 h-14 text-lg"
            disabled={isSubmitting}
          >
            Précédent
          </Button>
        ) : (
          <div className="flex-1" />
        )}
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || isSubmitting}
          className="flex-1 h-14 text-lg"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Enregistrement...
            </>
          ) : isLastStep ? (
            submitLabel
          ) : (
            "Suivant"
          )}
        </Button>
      </div>
    </div>
  );
}

interface StepContentProps {
  step: number;
  currentStep: number;
  children: React.ReactNode;
}

export function StepContent({ step, currentStep, children }: StepContentProps) {
  if (step !== currentStep) return null;
  return <>{children}</>;
}
