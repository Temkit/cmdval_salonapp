"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  FileText,
  Target,
  Check,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { QuestionnaireFlow, Question, QuestionAnswer } from "@/components/features/questionnaire";
import { BodyMap, Zone } from "@/components/features/zones";

// Wizard steps
const STEPS = [
  { id: "identity", label: "Identité", icon: User },
  { id: "questionnaire", label: "Questionnaire", icon: FileText },
  { id: "zones", label: "Zones", icon: Target },
  { id: "ready", label: "Prêt", icon: Check },
];

export default function NewPatientWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Form data
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<QuestionAnswer[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

  // Fetch questions for questionnaire
  const { data: questions = [] } = useQuery({
    queryKey: ["questionnaire-questions"],
    queryFn: () => api.getQuestions(),
  });

  // Fetch zone definitions
  const { data: zoneDefinitions = [] } = useQuery({
    queryKey: ["zone-definitions"],
    queryFn: () => api.getZoneDefinitions(),
  });

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: (data: { nom: string; prenom: string }) => api.createPatient(data),
    onSuccess: (data) => {
      setPatientId(data.id);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      haptics.success();
      // Auto-advance to questionnaire
      setCurrentStep(1);
    },
    onError: (error: any) => {
      haptics.error();
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer le patient.",
      });
    },
  });

  // Save questionnaire mutation
  const saveQuestionnaireMutation = useMutation({
    mutationFn: (answers: QuestionAnswer[]) =>
      api.saveQuestionnaireResponses(patientId!, answers),
    onSuccess: () => {
      haptics.success();
      setCurrentStep(2);
    },
    onError: () => {
      // Continue anyway - questionnaire is not critical
      setCurrentStep(2);
    },
  });

  // Add zones mutation
  const addZonesMutation = useMutation({
    mutationFn: async (zoneIds: string[]) => {
      // Add each zone to patient
      for (const zoneId of zoneIds) {
        await api.addPatientZone(patientId!, { zone_id: zoneId, seances_prevues: 6 });
      }
    },
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      setCurrentStep(3);
    },
    onError: () => {
      // Continue anyway
      setCurrentStep(3);
    },
  });

  // Step 1: Create patient
  const handleCreatePatient = () => {
    if (!nom.trim() || !prenom.trim()) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Veuillez remplir le nom et le prénom.",
      });
      return;
    }
    haptics.medium();
    createPatientMutation.mutate({ nom: nom.trim(), prenom: prenom.trim() });
  };

  // Step 2: Complete questionnaire
  const handleQuestionnaireComplete = async (answers: QuestionAnswer[]) => {
    setQuestionnaireAnswers(answers);
    if (patientId && answers.length > 0) {
      saveQuestionnaireMutation.mutate(answers);
    } else {
      setCurrentStep(2);
    }
  };

  // Skip questionnaire
  const handleSkipQuestionnaire = () => {
    haptics.light();
    setCurrentStep(2);
  };

  // Step 3: Toggle zone selection
  const handleZoneToggle = (zone: Zone) => {
    haptics.selection();
    setSelectedZones((prev) =>
      prev.includes(zone.id) ? prev.filter((id) => id !== zone.id) : [...prev, zone.id]
    );
  };

  // Step 3: Confirm zones
  const handleConfirmZones = () => {
    if (selectedZones.length > 0 && patientId) {
      addZonesMutation.mutate(selectedZones);
    } else {
      setCurrentStep(3);
    }
  };

  // Skip zones
  const handleSkipZones = () => {
    haptics.light();
    setCurrentStep(3);
  };

  // Final: Go to patient or start session
  const handleGoToPatient = () => {
    haptics.medium();
    router.push(`/patients/${patientId}`);
  };

  const handleStartSession = () => {
    haptics.heavy();
    router.push(`/patients/${patientId}/seance`);
  };

  // Progress percentage
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (currentStep === 0) {
                router.back();
              } else {
                setCurrentStep((s) => s - 1);
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isComplete = i < currentStep;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isActive && "bg-primary text-primary-foreground",
                    isComplete && "bg-primary/20 text-primary",
                    !isActive && !isComplete && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-10 text-center text-sm text-muted-foreground">
            {currentStep + 1}/{STEPS.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted mt-3 rounded-full overflow-hidden max-w-2xl mx-auto">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Step 1: Identity */}
        {currentStep === 0 && (
          <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-2xl font-bold text-center mb-2">
                Nouveau patient
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                Entrez le nom et prénom pour commencer
              </p>

              <div className="space-y-4">
                <FormField
                  label="Prénom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Prénom du patient"
                  autoFocus
                  required
                />
                <FormField
                  label="Nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Nom du patient"
                  required
                />
              </div>
            </div>

            {/* Bottom action */}
            <div className="pt-4 pb-6 safe-area-bottom">
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleCreatePatient}
                disabled={!nom.trim() || !prenom.trim() || createPatientMutation.isPending}
              >
                {createPatientMutation.isPending ? (
                  "Création..."
                ) : (
                  <>
                    Continuer
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Questionnaire */}
        {currentStep === 1 && (
          <>
            {questions.length > 0 ? (
              <QuestionnaireFlow
                questions={questions}
                patientName={`${prenom} ${nom}`}
                onComplete={handleQuestionnaireComplete}
                onClose={handleSkipQuestionnaire}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Pas de questionnaire</h2>
                <p className="text-muted-foreground text-center mb-8">
                  Aucune question configurée pour le moment.
                </p>
                <Button onClick={() => setCurrentStep(2)}>
                  Continuer
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Step 3: Zones */}
        {currentStep === 2 && (
          <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-center mb-2">
                Zones de traitement
              </h1>
              <p className="text-muted-foreground text-center mb-6">
                Sélectionnez les zones à traiter
              </p>

              <BodyMap
                zones={zoneDefinitions}
                selectedZoneIds={selectedZones}
                onSelectZone={handleZoneToggle}
                mode="select"
              />
            </div>

            {/* Bottom actions */}
            <div className="pt-4 pb-6 safe-area-bottom space-y-3">
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleConfirmZones}
                disabled={addZonesMutation.isPending}
              >
                {addZonesMutation.isPending ? (
                  "Enregistrement..."
                ) : selectedZones.length > 0 ? (
                  <>
                    Confirmer {selectedZones.length} zone{selectedZones.length > 1 ? "s" : ""}
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                ) : (
                  <>
                    Continuer sans zones
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Ready */}
        {currentStep === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">
              Patient créé !
            </h1>
            <p className="text-muted-foreground text-center mb-2">
              {prenom} {nom}
            </p>

            {selectedZones.length > 0 && (
              <p className="text-sm text-primary mb-8">
                {selectedZones.length} zone{selectedZones.length > 1 ? "s" : ""} sélectionnée{selectedZones.length > 1 ? "s" : ""}
              </p>
            )}

            {/* Bottom actions */}
            <div className="w-full space-y-3 pt-4 pb-6 safe-area-bottom">
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleStartSession}
              >
                <Zap className="h-5 w-5 mr-2" />
                Démarrer une séance
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full h-14"
                onClick={handleGoToPatient}
              >
                Voir le dossier patient
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
