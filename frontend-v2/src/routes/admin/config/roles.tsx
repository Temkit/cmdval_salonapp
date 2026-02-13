import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
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
      { value: "patients.read", label: "Consulter" },
      { value: "patients.create", label: "Creer" },
      { value: "patients.update", label: "Modifier" },
      { value: "patients.delete", label: "Supprimer" },
    ],
  },
  {
    label: "Seances",
    permissions: [
      { value: "sessions.read", label: "Consulter" },
      { value: "sessions.create", label: "Creer" },
    ],
  },
  {
    label: "Configuration",
    permissions: [
      { value: "config.read", label: "Consulter" },
      { value: "config.write", label: "Modifier" },
    ],
  },
  {
    label: "Utilisateurs",
    permissions: [
      { value: "users.read", label: "Consulter" },
      { value: "users.create", label: "Creer" },
      { value: "users.update", label: "Modifier" },
      { value: "users.delete", label: "Supprimer" },
    ],
  },
  {
    label: "Dashboard",
    permissions: [
      { value: "dashboard.read", label: "Consulter" },
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

            <div className="space-y-3">
              <Label>Permissions</Label>
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.permissions.map((perm) => (
                      <label
                        key={perm.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(perm.value)}
                          onChange={() => togglePermission(perm.value)}
                          className="rounded"
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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
