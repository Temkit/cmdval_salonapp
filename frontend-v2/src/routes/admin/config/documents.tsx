import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Pencil,
  RotateCcw,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type {
  DocumentTemplate,
  DocumentTemplateContent,
  DocumentTemplateSection,
} from "@/types";

export const Route = createFileRoute("/admin/config/documents")({
  component: AdminDocumentsPage,
});

function AdminDocumentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editContent, setEditContent] =
    useState<DocumentTemplateContent | null>(null);
  const [resetTarget, setResetTarget] = useState<DocumentTemplate | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["document-templates"],
    queryFn: () => api.getDocumentTemplates(),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateDocumentTemplate(editingType!, editContent!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast({ title: "Modele mis a jour" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: (docType: string) => api.resetDocumentTemplate(docType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast({ title: "Modele reinitialise" });
      setResetTarget(null);
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    },
  });

  const closeDialog = () => {
    setEditingType(null);
    setEditContent(null);
  };

  const openEdit = (tpl: DocumentTemplate) => {
    setEditingType(tpl.document_type);
    setEditContent(JSON.parse(JSON.stringify(tpl.content)));
  };

  const updateSection = (
    idx: number,
    field: keyof DocumentTemplateSection,
    value: string | string[],
  ) => {
    if (!editContent) return;
    const sections = [...editContent.sections];
    const current = sections[idx]!;
    sections[idx] = { ...current, [field]: value };
    setEditContent({ ...editContent, sections });
  };

  const addSection = () => {
    if (!editContent) return;
    setEditContent({
      ...editContent,
      sections: [...editContent.sections, { heading: "", content: "" }],
    });
  };

  const removeSection = (idx: number) => {
    if (!editContent) return;
    const sections = editContent.sections.filter((_, i) => i !== idx);
    setEditContent({ ...editContent, sections });
  };

  const toggleSectionType = (idx: number) => {
    if (!editContent) return;
    const sections = [...editContent.sections];
    const section = sections[idx]!;
    if (section.items) {
      sections[idx] = {
        heading: section.heading,
        content: section.items.join("\n"),
      };
    } else {
      sections[idx] = {
        heading: section.heading,
        items: (section.content || "").split("\n").filter(Boolean),
      };
    }
    setEditContent({ ...editContent, sections });
  };

  const templates = data?.templates ?? [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div>
        <h1 className="heading-2">Modeles de documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personnalisez le contenu des PDF generes (consentement, reglement,
          precautions)
        </p>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message}
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-4"
            >
              Reessayer
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 skeleton rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl.document_type}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{tpl.label}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(tpl)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {tpl.is_customized && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setResetTarget(tpl)}
                        title="Reinitialiser par defaut"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-orange-500" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {tpl.is_customized ? (
                    <Badge variant="outline" className="text-xs">
                      Personnalise
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Par defaut
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tpl.content.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tpl.content.sections.length} section
                    {tpl.content.sections.length !== 1 ? "s" : ""}
                  </p>
                  {tpl.updated_at && (
                    <p className="text-xs text-muted-foreground">
                      Modifie le{" "}
                      {new Date(tpl.updated_at).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingType}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Modifier :{" "}
              {templates.find((t) => t.document_type === editingType)?.label}
            </DialogTitle>
          </DialogHeader>
          {editContent && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label>Titre du document</Label>
                <Input
                  required
                  value={editContent.title}
                  onChange={(e) =>
                    setEditContent({ ...editContent, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Introduction</Label>
                <Textarea
                  rows={3}
                  value={editContent.intro}
                  onChange={(e) =>
                    setEditContent({ ...editContent, intro: e.target.value })
                  }
                  placeholder="Texte d'introduction. Utilisez {nom}, {prenom}, {code_carte} comme variables."
                />
                <p className="text-xs text-muted-foreground">
                  Variables disponibles : {"{nom}"}, {"{prenom}"},{" "}
                  {"{code_carte}"}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Sections</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSection}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter
                  </Button>
                </div>

                {editContent.sections.map((section, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          required
                          value={section.heading}
                          onChange={(e) =>
                            updateSection(idx, "heading", e.target.value)
                          }
                          placeholder="Titre de la section"
                          className="font-medium"
                        />
                        <div className="flex gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleSectionType(idx)}
                            title={
                              section.items
                                ? "Convertir en paragraphe"
                                : "Convertir en liste"
                            }
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeSection(idx)}
                            disabled={editContent.sections.length <= 1}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {section.items ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">
                              Liste a puces (une par ligne)
                            </Label>
                          </div>
                          <Textarea
                            rows={4}
                            value={section.items.join("\n")}
                            onChange={(e) =>
                              updateSection(
                                idx,
                                "items",
                                e.target.value.split("\n"),
                              )
                            }
                            placeholder="Un element par ligne"
                            className="text-sm"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Paragraphe
                          </Label>
                          <Textarea
                            rows={3}
                            value={section.content || ""}
                            onChange={(e) =>
                              updateSection(idx, "content", e.target.value)
                            }
                            placeholder="Contenu de la section"
                            className="text-sm"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {editingType === "precautions" && (
                <div className="space-y-2">
                  <Label>Avertissement (encadre rouge)</Label>
                  <Textarea
                    rows={2}
                    value={editContent.warning || ""}
                    onChange={(e) =>
                      setEditContent({
                        ...editContent,
                        warning: e.target.value || undefined,
                      })
                    }
                    placeholder="Texte d'avertissement important"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Conclusion</Label>
                <Textarea
                  rows={2}
                  value={editContent.closing}
                  onChange={(e) =>
                    setEditContent({ ...editContent, closing: e.target.value })
                  }
                  placeholder="Texte de conclusion"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Annuler
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending
                    ? "Enregistrement..."
                    : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Confirm */}
      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        title="Reinitialiser le modele"
        description={`Etes-vous sur de vouloir reinitialiser "${resetTarget?.label}" au contenu par defaut ? Les modifications seront perdues.`}
        variant="danger"
        confirmLabel="Reinitialiser"
        onConfirm={() =>
          resetTarget && resetMutation.mutate(resetTarget.document_type)
        }
        isLoading={resetMutation.isPending}
      />
    </div>
  );
}
