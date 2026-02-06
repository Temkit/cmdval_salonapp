import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Question } from "@/types";

export const Route = createFileRoute("/admin/config/questionnaire")({
  component: AdminQuestionnairePage,
});

const TYPE_LABELS: Record<string, string> = {
  boolean: "Oui/Non",
  text: "Texte",
  number: "Nombre",
  choice: "Choix",
  multiple: "Multiple",
};

const TYPE_VARIANTS: Record<string, "info" | "success" | "warning" | "secondary" | "outline"> = {
  boolean: "info",
  text: "secondary",
  number: "success",
  choice: "warning",
  multiple: "outline",
};

function AdminQuestionnairePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [form, setForm] = useState({
    texte: "",
    type_reponse: "boolean" as Question["type_reponse"],
    obligatoire: true,
    options: "",
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.getQuestions(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createQuestion({
        texte: form.texte,
        type_reponse: form.type_reponse,
        obligatoire: form.obligatoire,
        options:
          form.type_reponse === "choice" || form.type_reponse === "multiple"
            ? form.options
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Question creee" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateQuestion(editing!.id, {
        texte: form.texte,
        type_reponse: form.type_reponse,
        obligatoire: form.obligatoire,
        options:
          form.type_reponse === "choice" || form.type_reponse === "multiple"
            ? form.options
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Question mise a jour" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Question supprimee" });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => api.reorderQuestions({ question_ids: ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ texte: "", type_reponse: "boolean", obligatoire: true, options: "" });
  };

  const openEdit = (q: Question) => {
    setEditing(q);
    setForm({
      texte: q.texte,
      type_reponse: q.type_reponse,
      obligatoire: q.obligatoire,
      options: q.options?.join("\n") ?? "",
    });
    setDialogOpen(true);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const questions = [...(data?.questions ?? [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    [questions[index], questions[newIndex]] = [questions[newIndex]!, questions[index]!];
    reorderMutation.mutate(questions.map((q) => q.id));
  };

  const questions = data?.questions ?? [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2">Questionnaire</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {questions.length} question{questions.length !== 1 ? "s" : ""} configuree{questions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle question
        </Button>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message}</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">Reessayer</Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4"><div className="h-5 w-full skeleton rounded" /></CardContent></Card>
          ))}
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveQuestion(i, "up")}
                      disabled={i === 0 || reorderMutation.isPending}
                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveQuestion(i, "down")}
                      disabled={i === questions.length - 1 || reorderMutation.isPending}
                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{q.texte}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={TYPE_VARIANTS[q.type_reponse] ?? "secondary"} size="sm">
                        {TYPE_LABELS[q.type_reponse] ?? q.type_reponse}
                      </Badge>
                      {q.obligatoire && (
                        <Badge variant="destructive" size="sm">Obligatoire</Badge>
                      )}
                      {!q.is_active && (
                        <Badge variant="muted" size="sm">Inactif</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(q)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(q)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Aucune question"
          description="Configurez les questions du questionnaire de pre-consultation"
          action={{ label: "Nouvelle question", onClick: () => setDialogOpen(true) }}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la question" : "Nouvelle question"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editing ? updateMutation.mutate() : createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                required
                value={form.texte}
                onChange={(e) => setForm((f) => ({ ...f, texte: e.target.value }))}
                placeholder="Texte de la question..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Type de reponse</Label>
              <Select
                value={form.type_reponse}
                onValueChange={(v) => setForm((f) => ({ ...f, type_reponse: v as Question["type_reponse"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Oui/Non</SelectItem>
                  <SelectItem value="text">Texte</SelectItem>
                  <SelectItem value="number">Nombre</SelectItem>
                  <SelectItem value="choice">Choix unique</SelectItem>
                  <SelectItem value="multiple">Choix multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(form.type_reponse === "choice" || form.type_reponse === "multiple") && (
              <div className="space-y-2">
                <Label>Options (une par ligne)</Label>
                <Textarea
                  value={form.options}
                  onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                  placeholder={"Option 1\nOption 2\nOption 3"}
                  rows={4}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="obligatoire"
                checked={form.obligatoire}
                onChange={(e) => setForm((f) => ({ ...f, obligatoire: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="obligatoire" className="text-sm font-normal">Obligatoire</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? "Enregistrement..."
                  : editing ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer la question"
        description={`Etes-vous sur de vouloir supprimer "${deleteTarget?.texte}" ? Cette action est irreversible.`}
        variant="danger"
        confirmLabel="Supprimer"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
