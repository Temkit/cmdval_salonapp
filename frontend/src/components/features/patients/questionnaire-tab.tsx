"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface QuestionnaireTabProps {
  patientId: string;
}

interface Question {
  id: string;
  texte: string;
  type_reponse: "boolean" | "text" | "number" | "choice";
  options: string[] | null;
  obligatoire: boolean;
  ordre: number;
}

interface Response {
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
    onSuccess: (data: any) => {
      if (data?.responses) {
        const initialResponses: Record<string, string> = {};
        data.responses.forEach((r: Response) => {
          if (r.reponse !== null) {
            initialResponses[r.question_id] = r.reponse;
          }
        });
        setResponses(initialResponses);
      }
    },
  });

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
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
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
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Questionnaire médical</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {answeredCount} / {sortedQuestions.length} questions répondues
              {requiredCount > 0 && (
                <span className="ml-2">
                  ({answeredRequired} / {requiredCount} obligatoires)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {patientResponses?.complete ? (
              <Badge variant="success" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Complet
              </Badge>
            ) : (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Incomplet
              </Badge>
            )}
            <Button type="submit" disabled={!hasChanges || mutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedQuestions.length > 0 ? (
            <div className="space-y-6">
              {sortedQuestions.map((question: Question, index: number) => (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={question.id} className="flex items-center gap-2">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    {question.texte}
                    {question.obligatoire && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  {renderQuestionInput(question, responses[question.id] || "", handleChange)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Aucune question configurée dans le questionnaire.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}

function renderQuestionInput(
  question: Question,
  value: string,
  onChange: (questionId: string, value: string) => void
) {
  switch (question.type_reponse) {
    case "boolean":
      return (
        <Select
          value={value}
          onValueChange={(v) => onChange(question.id, v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une réponse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="oui">Oui</SelectItem>
            <SelectItem value="non">Non</SelectItem>
          </SelectContent>
        </Select>
      );

    case "choice":
      return (
        <Select
          value={value}
          onValueChange={(v) => onChange(question.id, v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une option" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "number":
      return (
        <Input
          id={question.id}
          type="number"
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder="Entrez une valeur"
        />
      );

    case "text":
    default:
      return (
        <Textarea
          id={question.id}
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder="Entrez votre réponse"
          rows={2}
        />
      );
  }
}
