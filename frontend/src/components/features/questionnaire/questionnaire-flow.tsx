"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Mic,
  MicOff,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

export interface Question {
  id: string;
  texte: string;
  type_reponse: "boolean" | "text" | "choice" | "multiple";
  options?: string[];
  obligatoire: boolean;
  ordre: number;
}

export interface QuestionAnswer {
  question_id: string;
  reponse: any;
}

interface QuestionnaireFlowProps {
  questions: Question[];
  existingAnswers?: QuestionAnswer[];
  patientName: string;
  onComplete: (answers: QuestionAnswer[]) => Promise<void>;
  onClose: () => void;
}

export function QuestionnaireFlow({
  questions,
  existingAnswers = [],
  patientName,
  onComplete,
  onClose,
}: QuestionnaireFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, any>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [textValue, setTextValue] = useState("");

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentAnswer = answers.get(currentQuestion?.id);

  // Initialize answers from existing
  useEffect(() => {
    const initialAnswers = new Map<string, any>();
    existingAnswers.forEach((a) => {
      initialAnswers.set(a.question_id, a.reponse);
    });
    setAnswers(initialAnswers);
  }, [existingAnswers]);

  // Update text value when question changes
  useEffect(() => {
    if (currentQuestion?.type_reponse === "text") {
      setTextValue(answers.get(currentQuestion.id) || "");
    }
  }, [currentIndex, currentQuestion, answers]);

  // Save answer
  const saveAnswer = useCallback(
    (value: any) => {
      haptics.selection();
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(currentQuestion.id, value);
        return next;
      });
    },
    [currentQuestion]
  );

  // Go to next question
  const goNext = useCallback(() => {
    haptics.light();

    // Save text answer if applicable
    if (currentQuestion.type_reponse === "text" && textValue) {
      saveAnswer(textValue);
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
    }
  }, [currentQuestion, textValue, isLastQuestion, questions.length, saveAnswer]);

  // Go to previous question
  const goPrev = useCallback(() => {
    haptics.light();
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Skip question
  const skipQuestion = useCallback(() => {
    haptics.light();
    if (!currentQuestion.obligatoire) {
      goNext();
    }
  }, [currentQuestion, goNext]);

  // Submit all answers
  const handleSubmit = async () => {
    setIsSubmitting(true);
    haptics.success();

    const answersArray: QuestionAnswer[] = [];
    answers.forEach((value, questionId) => {
      if (value !== undefined && value !== null && value !== "") {
        answersArray.push({ question_id: questionId, reponse: value });
      }
    });

    try {
      await onComplete(answersArray);
    } catch (error) {
      haptics.error();
      console.error("Error submitting questionnaire:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle boolean answer
  const handleBoolean = (value: boolean) => {
    saveAnswer(value);
    // Auto-advance after 300ms
    setTimeout(() => goNext(), 300);
  };

  // Handle choice answer
  const handleChoice = (value: string) => {
    saveAnswer(value);
    setTimeout(() => goNext(), 300);
  };

  // Handle multiple choice
  const handleMultiple = (value: string) => {
    const current = (currentAnswer as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    saveAnswer(updated);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "Enter":
          if (currentAnswer !== undefined || !currentQuestion.obligatoire) {
            goNext();
          }
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "Escape":
          onClose();
          break;
        case "1":
        case "y":
          if (currentQuestion.type_reponse === "boolean") {
            handleBoolean(true);
          }
          break;
        case "2":
        case "n":
          if (currentQuestion.type_reponse === "boolean") {
            handleBoolean(false);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentAnswer, currentQuestion, goNext, goPrev, onClose]);

  if (!currentQuestion) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 safe-area-top">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Questionnaire</p>
          <p className="font-medium">{patientName}</p>
        </div>
        <div className="w-10 text-center text-sm text-muted-foreground">
          {currentIndex + 1}/{questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted mx-4 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Question Text */}
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 leading-tight">
            {currentQuestion.texte}
            {currentQuestion.obligatoire && (
              <span className="text-destructive ml-1">*</span>
            )}
          </h2>

          {/* Boolean Answer */}
          {currentQuestion.type_reponse === "boolean" && (
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleBoolean(true)}
                className={cn(
                  "flex flex-col items-center justify-center w-32 h-32 rounded-3xl border-4 transition-all",
                  "hover:border-green-500 hover:bg-green-500/10 active:scale-95",
                  currentAnswer === true
                    ? "border-green-500 bg-green-500/20"
                    : "border-border"
                )}
              >
                <Check
                  className={cn(
                    "h-12 w-12 mb-2 transition-colors",
                    currentAnswer === true ? "text-green-500" : "text-muted-foreground"
                  )}
                />
                <span className="font-semibold text-lg">Oui</span>
              </button>

              <button
                onClick={() => handleBoolean(false)}
                className={cn(
                  "flex flex-col items-center justify-center w-32 h-32 rounded-3xl border-4 transition-all",
                  "hover:border-red-500 hover:bg-red-500/10 active:scale-95",
                  currentAnswer === false
                    ? "border-red-500 bg-red-500/20"
                    : "border-border"
                )}
              >
                <X
                  className={cn(
                    "h-12 w-12 mb-2 transition-colors",
                    currentAnswer === false ? "text-red-500" : "text-muted-foreground"
                  )}
                />
                <span className="font-semibold text-lg">Non</span>
              </button>
            </div>
          )}

          {/* Text Answer */}
          {currentQuestion.type_reponse === "text" && (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Votre réponse..."
                  className={cn(
                    "w-full h-32 p-4 text-lg bg-muted rounded-2xl resize-none",
                    "focus:outline-none focus:ring-2 focus:ring-primary"
                  )}
                  autoFocus
                />
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={cn(
                    "absolute bottom-3 right-3 p-3 rounded-full transition-all",
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-background hover:bg-muted"
                  )}
                  type="button"
                >
                  {isRecording ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </button>
              </div>
              {isRecording && (
                <p className="text-center text-sm text-red-500 animate-pulse">
                  Enregistrement en cours...
                </p>
              )}
            </div>
          )}

          {/* Choice Answer */}
          {currentQuestion.type_reponse === "choice" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleChoice(option)}
                  className={cn(
                    "w-full p-5 text-left text-lg rounded-2xl border-2 transition-all",
                    "hover:border-primary hover:bg-primary/5 active:scale-[0.98]",
                    currentAnswer === option
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  )}
                >
                  <span className="font-medium">{option}</span>
                </button>
              ))}
            </div>
          )}

          {/* Multiple Choice Answer */}
          {currentQuestion.type_reponse === "multiple" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, i) => {
                const isSelected = (currentAnswer as string[])?.includes(option);
                return (
                  <button
                    key={i}
                    onClick={() => handleMultiple(option)}
                    className={cn(
                      "w-full p-5 text-left text-lg rounded-2xl border-2 transition-all",
                      "hover:border-primary hover:bg-primary/5 active:scale-[0.98]",
                      "flex items-center gap-4",
                      isSelected ? "border-primary bg-primary/10" : "border-border"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className="font-medium">{option}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t safe-area-bottom">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="h-14 px-6"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Précédent
          </Button>

          {/* Skip Button (if optional) */}
          {!currentQuestion.obligatoire && !currentAnswer && (
            <Button
              variant="ghost"
              size="lg"
              onClick={skipQuestion}
              className="h-14 px-6 text-muted-foreground"
            >
              <SkipForward className="h-5 w-5 mr-2" />
              Passer
            </Button>
          )}

          {/* Next/Submit Button */}
          <Button
            size="lg"
            onClick={goNext}
            disabled={
              currentQuestion.obligatoire &&
              currentAnswer === undefined &&
              currentQuestion.type_reponse !== "text"
            }
            className="h-14 px-6"
          >
            {isLastQuestion ? (
              isSubmitting ? (
                "Envoi..."
              ) : (
                <>
                  Terminer
                  <Check className="h-5 w-5 ml-2" />
                </>
              )
            ) : (
              <>
                Suivant
                <ChevronRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
