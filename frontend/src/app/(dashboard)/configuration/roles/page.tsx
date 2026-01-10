"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface RoleForm {
  nom: string;
  description: string;
  permissions: string[];
}

const initialFormState: RoleForm = {
  nom: "",
  description: "",
  permissions: [],
};

const PERMISSION_GROUPS = {
  Patients: ["patients.read", "patients.create", "patients.update", "patients.delete"],
  Sessions: ["sessions.read", "sessions.create"],
  Configuration: ["config.read", "config.write"],
  Utilisateurs: ["users.read", "users.create", "users.update", "users.delete"],
  Dashboard: ["dashboard.read"],
};

const PERMISSION_LABELS: Record<string, string> = {
  "patients.read": "Voir les patients",
  "patients.create": "Créer des patients",
  "patients.update": "Modifier les patients",
  "patients.delete": "Supprimer les patients",
  "sessions.read": "Voir les séances",
  "sessions.create": "Créer des séances",
  "config.read": "Voir la configuration",
  "config.write": "Modifier la configuration",
  "users.read": "Voir les utilisateurs",
  "users.create": "Créer des utilisateurs",
  "users.update": "Modifier les utilisateurs",
  "users.delete": "Supprimer les utilisateurs",
  "dashboard.read": "Voir le tableau de bord",
};

export default function RolesConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState<RoleForm>(initialFormState);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.getRoles(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Rôle créé" });
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
      api.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Rôle mis à jour" });
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
    mutationFn: (id: string) => api.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Rôle supprimé" });
      setDeleteRoleId(null);
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
    setEditingRole(null);
    setFormData(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      nom: role.nom,
      description: role.description || "",
      permissions: role.permissions || [],
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
    setFormData(initialFormState);
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      nom: formData.nom,
      description: formData.description || null,
      permissions: formData.permissions,
    };

    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/configuration">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="heading-1">Rôles</h1>
            <p className="text-secondary">
              Configurer les rôles et permissions
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rôle
        </Button>
      </div>

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des rôles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Chargement des rôles">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full skeleton" />
                      <div className="space-y-2">
                        <div className="h-5 w-28 skeleton rounded" />
                        <div className="h-4 w-40 skeleton rounded" />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="h-8 w-8 skeleton rounded" />
                      <div className="h-8 w-8 skeleton rounded" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-5 w-24 skeleton rounded-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : roles?.roles?.length > 0 ? (
            <div className="space-y-3">
              {roles.roles.map((role: any) => (
                <div
                  key={role.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{role.nom}</p>
                        {role.description && (
                          <p className="text-sm text-muted-foreground">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteRoleId(role.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.map((perm: string) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {PERMISSION_LABELS[perm] || perm}
                      </Badge>
                    ))}
                    {(!role.permissions || role.permissions.length === 0) && (
                      <span className="text-sm text-muted-foreground">
                        Aucune permission
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Shield}
              title="Aucun rôle"
              description="Créez des rôles pour organiser les permissions des utilisateurs"
              action={{
                label: "Créer un rôle",
                onClick: handleOpenCreate,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Modifier le rôle" : "Nouveau rôle"}
              </DialogTitle>
              <DialogDescription>
                {editingRole
                  ? "Modifiez les informations et permissions du rôle."
                  : "Créez un nouveau rôle avec ses permissions."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du rôle</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nom: e.target.value }))
                    }
                    placeholder="Ex: Praticien"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Ex: Accès aux traitements"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Permissions</Label>
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group} className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {group}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <button
                          key={perm}
                          type="button"
                          onClick={() => togglePermission(perm)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-colors ${
                            formData.permissions.includes(perm)
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded flex items-center justify-center ${
                              formData.permissions.includes(perm)
                                ? "bg-primary text-primary-foreground"
                                : "border"
                            }`}
                          >
                            {formData.permissions.includes(perm) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                          {PERMISSION_LABELS[perm]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Enregistrement..."
                  : editingRole
                  ? "Enregistrer"
                  : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteRoleId}
        onOpenChange={() => setDeleteRoleId(null)}
        title="Supprimer le rôle"
        description="Les utilisateurs associés perdront les permissions de ce rôle."
        itemName={
          deleteRoleId
            ? roles?.roles?.find((r: any) => r.id === deleteRoleId)?.nom
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => deleteRoleId && deleteMutation.mutate(deleteRoleId)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
