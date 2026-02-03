"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToggleButton, ButtonGroup } from "@/components/ui/button-group";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Question } from "@/types";

interface QuestionnaireTabProps {
  patientId: string;
}

interface QuestionnaireResponse {
  question_id: string;
  reponse: string | null;
}

export function QuestionnaireTab({ patientId }: QuestionnaireTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.getQuestions(),
  });

  const { data: patientResponses, isLoading: responsesLoading } = useQuery({
    queryKey: ["patient-questionnaire", patientId],
    queryFn: () => api.getPatientQuestionnaire(patientId),
  });

  // Initialize responses when data loads
  useEffect(() => {
    if (patientResponses?.responses) {
      const initialResponses: Record<string, string> = {};
      patientResponses.responses.forEach((r: QuestionnaireResponse) => {
        if (r.reponse !== null) {
          initialResponses[r.question_id] = r.reponse;
        }
      });
      setResponses(initialResponses);
    }
  }, [patientResponses]);

  const mutation = useMutation({
    mutationFn: (responses: Array<{ question_id: string; reponse: string | null }>) =>
      api.updatePatientQuestionnaire(patientId, responses),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-questionnaire", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      toast({
        title: "Questionnaire enregistré",
        description: "Les réponses ont été enregistrées avec succès.",
      });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le questionnaire.",
      });
    },
  });

  const handleChange = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedResponses = Object.entries(responses).map(([questionId, reponse]) => ({
      question_id: questionId,
      reponse: reponse || null,
    }));
    mutation.mutate(formattedResponses);
  };

  const isLoading = questionsLoading || responsesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedQuestions = questions?.questions?.sort(
    (a: Question, b: Question) => a.ordre - b.ordre
  ) || [];

  const answeredCount = Object.values(responses).filter((r) => r && r.trim() !== "").length;
  const requiredCount = sortedQuestions.filter((q: Question) => q.obligatoire).length;
  const answeredRequired = sortedQuestions.filter(
    (q: Question) => q.obligatoire && responses[q.id] && responses[q.id].trim() !== ""
  ).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header with progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {answeredCount} / {sortedQuestions.length} réponses
              </p>
              <div className="flex items-center gap-2 mt-1">
                {patientResponses?.complete ? (
                  <Badge variant="default" className="bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Complet
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Incomplet
                  </Badge>
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={!hasChanges || mutation.isPending}
              className="h-12 px-6"
            >
              <Save className="h-5 w-5 mr-2" />
              {mutation.isPending ? "..." : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      {sortedQuestions.length > 0 ? (
        <div className="space-y-3">
          {sortedQuestions.map((question: Question, index: number) => (
            <Card key={question.id}>
              <CardContent className="py-4">
                <div className="space-y-3">
                  <Label className="text-base leading-relaxed flex items-start gap-2">
                    <span className="text-muted-foreground shrink-0">{index + 1}.</span>
                    <span>
                      {question.texte}
                      {question.obligatoire && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </span>
                  </Label>
                  <QuestionInput
                    question={question}
                    value={responses[question.id] || ""}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Aucune question configurée dans le questionnaire.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sticky save button */}
      {hasChanges && (
        <div className="sticky bottom-4">
          <Button
            type="submit"
            className="w-full h-14 text-lg shadow-lg"
            disabled={mutation.isPending}
          >
            <Save className="h-5 w-5 mr-2" />
            {mutation.isPending ? "Enregistrement..." : "Enregistrer les réponses"}
          </Button>
        </div>
      )}
    </form>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (questionId: string, value: string) => void;
}) {
  switch (question.type_reponse) {
    case "boolean":
      return (
        <ToggleButton
          value={value === "oui" ? true : value === "non" ? false : null}
          onChange={(v) => onChange(question.id, v ? "oui" : "non")}
        />
      );

    case "choice":
      const options = question.options?.map(opt => ({ value: opt, label: opt })) || [];
      const columns = options.length <= 3 ? options.length : options.length <= 4 ? 2 : 3;
      return (
        <ButtonGroup
          options={options}
          value={value}
          onChange={(v) => onChange(question.id, v)}
          columns={columns as 2 | 3 | 4 | 5 | 6}
          size="md"
        />
      );

    case "number":
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const num = parseInt(value) || 0;
              if (num > 0) onChange(question.id, (num - 1).toString());
            }}
            className="min-h-[56px] min-w-[56px] rounded-lg border-2 border-border bg-background text-2xl font-bold hover:bg-muted active:scale-95"
          >
            -
          </button>
          <div className="flex-1 min-h-[56px] flex items-center justify-center rounded-lg border-2 border-border bg-muted/50 text-xl font-semibold">
            {value || "0"}
          </div>
          <button
            type="button"
            onClick={() => {
              const num = parseInt(value) || 0;
              onChange(question.id, (num + 1).toString());
            }}
            className="min-h-[56px] min-w-[56px] rounded-lg border-2 border-border bg-background text-2xl font-bold hover:bg-muted active:scale-95"
          >
            +
          </button>
        </div>
      );

    case "text":
    default:
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder="Entrez votre réponse..."
          rows={2}
          className="w-full rounded-lg border-2 border-border p-4 text-lg resize-none focus:border-primary focus:outline-none"
        />
      );
  }
}
