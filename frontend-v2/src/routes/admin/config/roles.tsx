import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
import type { Role } from "@/types";

export const Route = createFileRoute("/admin/config/roles")({
  component: AdminRolesPage,
});

const PERMISSION_GROUPS: {
  label: string;
  permissions: { value: string; label: string }[];
}[] = [
  {
    label: "Patients",
    permissions: [
      { value: "patients.view", label: "Consulter" },
      { value: "patients.create", label: "Creer" },
      { value: "patients.edit", label: "Modifier" },
      { value: "patients.delete", label: "Supprimer" },
      { value: "patients.questionnaire.view", label: "Voir questionnaire" },
      { value: "patients.questionnaire.edit", label: "Modifier questionnaire" },
    ],
  },
  {
    label: "Agenda / Planning",
    permissions: [
      { value: "schedule.view", label: "Consulter" },
      { value: "schedule.manage", label: "Gerer" },
    ],
  },
  {
    label: "File d'attente",
    permissions: [
      { value: "queue.view", label: "Consulter" },
      { value: "queue.manage", label: "Gerer" },
    ],
  },
  {
    label: "Seances",
    permissions: [
      { value: "sessions.view", label: "Consulter" },
      { value: "sessions.create", label: "Creer" },
    ],
  },
  {
    label: "Pre-consultations",
    permissions: [
      { value: "pre_consultations.view", label: "Consulter" },
      { value: "pre_consultations.create", label: "Creer" },
      { value: "pre_consultations.edit", label: "Modifier" },
      { value: "pre_consultations.delete", label: "Supprimer" },
      { value: "pre_consultations.validate", label: "Valider" },
    ],
  },
  {
    label: "Paiements",
    permissions: [
      { value: "payments.view", label: "Consulter" },
      { value: "payments.create", label: "Creer" },
      { value: "payments.edit", label: "Modifier" },
    ],
  },
  {
    label: "Documents",
    permissions: [
      { value: "documents.view", label: "Consulter" },
      { value: "documents.manage", label: "Gerer" },
    ],
  },
  {
    label: "Zones",
    permissions: [
      { value: "zones.view", label: "Consulter" },
      { value: "zones.manage", label: "Gerer" },
    ],
  },
  {
    label: "Cabines",
    permissions: [
      { value: "boxes.view", label: "Consulter" },
      { value: "boxes.assign", label: "Assigner" },
      { value: "config.boxes", label: "Configurer" },
    ],
  },
  {
    label: "Utilisateurs",
    permissions: [
      { value: "users.view", label: "Consulter" },
      { value: "users.manage", label: "Gerer" },
    ],
  },
  {
    label: "Roles",
    permissions: [
      { value: "roles.view", label: "Consulter" },
      { value: "roles.manage", label: "Gerer" },
    ],
  },
  {
    label: "Configuration",
    permissions: [
      { value: "config.questionnaire", label: "Questionnaire" },
      { value: "config.zones", label: "Zones" },
      { value: "config.manage", label: "Gestion generale" },
    ],
  },
  {
    label: "Dashboard",
    permissions: [
      { value: "dashboard.view", label: "Consulter" },
      { value: "dashboard.full", label: "Complet" },
    ],
  },
];

function AdminRolesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [form, setForm] = useState({ nom: "", description: "", permissions: [] as string[] });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.getRoles(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createRole({ nom: form.nom, permissions: form.permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role cree" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => api.updateRole(editing!.id, {
      ...(editing!.is_system ? {} : { nom: form.nom }),
      permissions: form.permissions,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role mis a jour" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role supprime" });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ nom: "", description: "", permissions: [] });
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setForm({
      nom: role.nom,
      description: role.description ?? "",
      permissions: [...role.permissions],
    });
    setDialogOpen(true);
  };

  const togglePermission = (perm: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const toggleGroup = (group: typeof PERMISSION_GROUPS[number]) => {
    const groupPerms = group.permissions.map((p) => p.value);
    const allSelected = groupPerms.every((p) => form.permissions.includes(p));
    setForm((f) => ({
      ...f,
      permissions: allSelected
        ? f.permissions.filter((p) => !groupPerms.includes(p))
        : [...new Set([...f.permissions, ...groupPerms])],
    }));
  };

  const allPermissions = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.value));
  const toggleAll = () => {
    const allSelected = allPermissions.every((p) => form.permissions.includes(p));
    setForm((f) => ({ ...f, permissions: allSelected ? [] : [...allPermissions] }));
  };

  const roles = data?.roles ?? [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2">Roles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {roles.length} role{roles.length !== 1 ? "s" : ""} configure{roles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau role
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
            <Card key={i}><CardContent className="p-4"><div className="h-5 w-48 skeleton rounded" /></CardContent></Card>
          ))}
        </div>
      ) : roles.length > 0 ? (
        <div className="space-y-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{role.nom}</p>
                      {role.is_system && <Badge variant="outline" size="sm">Systeme</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" size="sm">
                        {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                      </Badge>
                      {role.description && (
                        <span className="text-xs text-muted-foreground truncate">{role.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(role)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(role)} disabled={role.is_system}>
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
          icon={Shield}
          title="Aucun role"
          description="Creez des roles pour gerer les permissions"
          action={{ label: "Nouveau role", onClick: () => setDialogOpen(true) }}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le role" : "Nouveau role"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editing ? updateMutation.mutate() : createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                required
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Ex: Secretaire"
                disabled={editing?.is_system}
              />
              {editing?.is_system && (
                <p className="text-xs text-muted-foreground">Le nom d'un role systeme ne peut pas etre modifie</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions ({form.permissions.length}/{allPermissions.length})</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={toggleAll}
                >
                  {allPermissions.every((p) => form.permissions.includes(p))
                    ? "Tout deselectionner"
                    : "Tout selectionner"}
                </Button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto rounded-lg border divide-y">
                {PERMISSION_GROUPS.map((group) => {
                  const groupPerms = group.permissions.map((p) => p.value);
                  const selectedCount = groupPerms.filter((p) => form.permissions.includes(p)).length;
                  const allGroupSelected = selectedCount === groupPerms.length;
                  return (
                    <div key={group.label} className="px-3 py-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group)}
                          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                        >
                          <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${allGroupSelected ? "bg-primary border-primary" : selectedCount > 0 ? "bg-primary/30 border-primary" : "border-muted-foreground/30"}`}>
                            {allGroupSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            {!allGroupSelected && selectedCount > 0 && <div className="h-1.5 w-1.5 rounded-sm bg-primary-foreground" />}
                          </div>
                          {group.label}
                        </button>
                        <span className="text-xs text-muted-foreground">{selectedCount}/{groupPerms.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.permissions.map((perm) => {
                          const active = form.permissions.includes(perm.value);
                          return (
                            <button
                              key={perm.value}
                              type="button"
                              onClick={() => togglePermission(perm.value)}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                active
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {perm.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || form.permissions.length === 0}
              >
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
        title="Supprimer le role"
        description={`Etes-vous sur de vouloir supprimer le role "${deleteTarget?.nom}" ? Les utilisateurs associes perdront ces permissions.`}
        variant="danger"
        confirmLabel="Supprimer"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
