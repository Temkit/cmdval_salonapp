"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  FileText,
  GripVertical,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface QuestionForm {
  texte: string;
  type_reponse: string;
  options: string;
  obligatoire: boolean;
}

const initialFormState: QuestionForm = {
  texte: "",
  type_reponse: "boolean",
  options: "",
  obligatoire: false,
};

const TYPE_LABELS: Record<string, string> = {
  boolean: "Oui/Non",
  text: "Texte libre",
  number: "Nombre",
  choice: "Choix multiple",
};

export default function QuestionnaireConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [formData, setFormData] = useState<QuestionForm>(initialFormState);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.getQuestions(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Question créée" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Question mise à jour" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Question supprimée" });
      setDeleteQuestionId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (data: { question_ids: string[] }) =>
      api.reorderQuestions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormData(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (question: any) => {
    setEditingQuestion(question);
    setFormData({
      texte: question.texte,
      type_reponse: question.type_reponse,
      options: question.options?.join("\n") || "",
      obligatoire: question.obligatoire,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingQuestion(null);
    setFormData(initialFormState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      texte: formData.texte,
      type_reponse: formData.type_reponse,
      obligatoire: formData.obligatoire,
    };

    if (formData.type_reponse === "choice" && formData.options) {
      data.options = formData.options
        .split("\n")
        .map((o) => o.trim())
        .filter((o) => o);
    } else {
      data.options = null;
    }

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (!questions?.questions) return;
    const sorted = [...questions.questions].sort((a: any, b: any) => a.ordre - b.ordre);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    const newOrder = [...sorted];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    reorderMutation.mutate({ question_ids: newOrder.map((q: any) => q.id) });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const sortedQuestions = questions?.questions?.sort(
    (a: any, b: any) => a.ordre - b.ordre
  ) || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/configuration">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="heading-2">Questionnaire</h1>
          <p className="text-sm text-muted-foreground">
            Personnaliser le questionnaire medical
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle question
        </Button>
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions du questionnaire</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Chargement des questions">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 border rounded-xl">
                  {/* Reorder buttons skeleton */}
                  <div className="flex flex-col gap-1">
                    <div className="h-6 w-6 skeleton rounded" />
                    <div className="h-6 w-6 skeleton rounded" />
                  </div>
                  {/* Content skeleton */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-6 skeleton rounded" />
                      <div className="h-5 w-48 skeleton rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-16 skeleton rounded-full" />
                      <div className="h-4 w-20 skeleton rounded" />
                    </div>
                  </div>
                  {/* Actions skeleton */}
                  <div className="flex gap-1">
                    <div className="h-8 w-8 skeleton rounded" />
                    <div className="h-8 w-8 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedQuestions.length > 0 ? (
            <div className="space-y-2">
              {sortedQuestions.map((question: any, index: number) => (
                <div
                  key={question.id}
                  className="flex items-center gap-3 p-4 border rounded-xl"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveQuestion(index, "up")}
                      disabled={index === 0}
                      className="p-1 hover:bg-muted rounded disabled:opacity-30"
                    >
                      <GripVertical className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(index, "down")}
                      disabled={index === sortedQuestions.length - 1}
                      className="p-1 hover:bg-muted rounded disabled:opacity-30"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {index + 1}.
                      </span>
                      <p className="font-medium">{question.texte}</p>
                      {question.obligatoire && (
                        <span className="text-destructive">*</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[question.type_reponse]}
                      </Badge>
                      {question.type_reponse === "choice" &&
                        question.options && (
                          <span className="text-xs text-muted-foreground">
                            ({question.options.length} options)
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(question)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteQuestionId(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Aucune question"
              description="Ajoutez des questions pour créer le questionnaire médical des patients"
              action={{
                label: "Ajouter une question",
                onClick: handleOpenCreate,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Modifier la question" : "Nouvelle question"}
              </DialogTitle>
              <DialogDescription>
                {editingQuestion
                  ? "Modifiez le texte et les paramètres de la question."
                  : "Ajoutez une nouvelle question au questionnaire."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="texte">Texte de la question</Label>
                <Textarea
                  id="texte"
                  value={formData.texte}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, texte: e.target.value }))
                  }
                  placeholder="Ex: Avez-vous des allergies connues ?"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type_reponse">Type de réponse</Label>
                  <Select
                    value={formData.type_reponse}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, type_reponse: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Obligatoire</Label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        obligatoire: !prev.obligatoire,
                      }))
                    }
                    className={`flex items-center gap-2 w-full p-2 rounded-lg border text-left transition-colors ${
                      formData.obligatoire
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded flex items-center justify-center ${
                        formData.obligatoire
                          ? "bg-primary text-primary-foreground"
                          : "border"
                      }`}
                    >
                      {formData.obligatoire && <Check className="h-3 w-3" />}
                    </div>
                    Question obligatoire
                  </button>
                </div>
              </div>

              {formData.type_reponse === "choice" && (
                <div className="space-y-2">
                  <Label htmlFor="options">Options (une par ligne)</Label>
                  <Textarea
                    id="options"
                    value={formData.options}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, options: e.target.value }))
                    }
                    placeholder="Option 1\nOption 2\nOption 3"
                    rows={4}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Enregistrement..."
                  : editingQuestion
                  ? "Enregistrer"
                  : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteQuestionId}
        onOpenChange={() => setDeleteQuestionId(null)}
        title="Supprimer la question"
        description="Les réponses existantes seront conservées mais cette question ne sera plus affichée."
        itemName={
          deleteQuestionId
            ? questions?.questions?.find((q: any) => q.id === deleteQuestionId)?.texte?.slice(0, 50) +
              (questions?.questions?.find((q: any) => q.id === deleteQuestionId)?.texte?.length > 50 ? "..." : "")
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => deleteQuestionId && deleteMutation.mutate(deleteQuestionId)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
