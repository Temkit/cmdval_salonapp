"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, User, Check, X, Filter } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface UserForm {
  email: string;
  nom: string;
  prenom: string;
  password: string;
  role_id: string;
}

const initialFormState: UserForm = {
  email: "",
  nom: "",
  prenom: "",
  password: "",
  role_id: "",
};

export default function UsersConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<UserForm>(initialFormState);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.getRoles(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Utilisateur créé" });
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
      api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Utilisateur mis à jour" });
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
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Utilisateur supprimé" });
      setDeleteUserId(null);
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
    setEditingUser(null);
    setFormData(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      password: "",
      role_id: user.role_id,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData(initialFormState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      email: formData.email,
      nom: formData.nom,
      prenom: formData.prenom,
      role_id: formData.role_id,
    };

    if (formData.password) {
      data.password = formData.password;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      if (!formData.password) {
        toast({
          variant: "destructive",
          title: "Mot de passe requis",
          description: "Le mot de passe est obligatoire pour un nouvel utilisateur.",
        });
        return;
      }
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Filter users based on role
  const filteredUsers = users?.users?.filter(
    (user: any) => roleFilter === "all" || user.role_id === roleFilter
  ) || [];

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
            <h1 className="heading-1">Utilisateurs</h1>
            <p className="text-secondary">
              Gérer les comptes utilisateurs
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <CardTitle>Liste des utilisateurs</CardTitle>
            {!isLoading && (
              <Badge variant="secondary">
                {filteredUsers.length}
                {roleFilter !== "all" && ` / ${users?.users?.length || 0}`}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roles?.roles?.map((role: any) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Chargement des utilisateurs">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full skeleton" />
                    <div className="space-y-2">
                      <div className="h-5 w-32 skeleton rounded" />
                      <div className="h-4 w-40 skeleton rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-5 w-20 skeleton rounded-full" />
                    <div className="h-5 w-14 skeleton rounded-full" />
                    <div className="flex gap-1">
                      <div className="h-8 w-8 skeleton rounded" />
                      <div className="h-8 w-8 skeleton rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {filteredUsers.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.prenom} {user.nom}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{user.role_nom}</Badge>
                    <Badge variant={user.actif ? "success" : "secondary"}>
                      {user.actif ? "Actif" : "Inactif"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteUserId(user.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : users?.users?.length > 0 && roleFilter !== "all" ? (
            <EmptyState
              icon={Filter}
              title="Aucun résultat"
              description="Aucun utilisateur ne correspond à ce filtre"
              action={{
                label: "Réinitialiser le filtre",
                onClick: () => setRoleFilter("all"),
              }}
            />
          ) : (
            <EmptyState
              icon={User}
              title="Aucun utilisateur"
              description="Créez votre premier utilisateur pour commencer"
              action={{
                label: "Créer un utilisateur",
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
                {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Modifiez les informations de l'utilisateur."
                  : "Créez un nouveau compte utilisateur."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, prenom: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nom: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Mot de passe {editingUser && "(laisser vide pour ne pas changer)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required={!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={formData.role_id}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, role_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.roles?.map((role: any) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Enregistrement..."
                  : editingUser
                  ? "Enregistrer"
                  : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteUserId}
        onOpenChange={() => setDeleteUserId(null)}
        title="Supprimer l'utilisateur"
        description="Cette action est irréversible. L'utilisateur perdra l'accès à l'application."
        itemName={
          deleteUserId
            ? users?.users?.find((u: any) => u.id === deleteUserId)?.prenom +
              " " +
              users?.users?.find((u: any) => u.id === deleteUserId)?.nom
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
