import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Shield,
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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { User } from "@/types";

export const Route = createFileRoute("/admin/config/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    nom: "",
    prenom: "",
    role_id: "",
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.getRoles(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createUser({
        username: form.username,
        password: form.password,
        nom: form.nom,
        prenom: form.prenom,
        role_id: form.role_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Utilisateur cree" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateUser(editingUser!.id, {
        nom: form.nom,
        prenom: form.prenom,
        role_id: form.role_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Utilisateur mis a jour" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Utilisateur supprime" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setForm({ username: "", password: "", nom: "", prenom: "", role_id: "" });
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      password: "",
      nom: user.nom,
      prenom: user.prenom,
      role_id: user.role_id,
    });
    setDialogOpen(true);
  };

  const users = data?.users ?? [];
  const roles = rolesData?.roles ?? [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message}
            </p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Reessayer
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-5 w-48 skeleton rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {u.prenom} {u.nom}
                      </p>
                      {!u.is_active && (
                        <Badge variant="muted" size="sm">Inactif</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      @{u.username}
                    </p>
                  </div>
                  <Badge variant="secondary" size="sm" className="gap-1 shrink-0">
                    <Shield className="h-3 w-3" />
                    {u.role_nom ?? "Aucun role"}
                  </Badge>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(u)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        if (confirm("Supprimer cet utilisateur ?")) deleteMutation.mutate(u.id);
                      }}
                    >
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
          icon={UserCog}
          title="Aucun utilisateur"
          description="Ajoutez des utilisateurs au systeme"
          action={{ label: "Nouvel utilisateur", onClick: () => setDialogOpen(true) }}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingUser ? updateMutation.mutate() : createMutation.mutate();
            }}
            className="space-y-4"
          >
            {!editingUser && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom d'utilisateur</Label>
                  <Input
                    required
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <Input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prenom</Label>
                <Input
                  required
                  value={form.prenom}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  required
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-2 flex-wrap">
                {roles.map((role) => (
                  <Button
                    key={role.id}
                    type="button"
                    variant={form.role_id === role.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setForm((f) => ({ ...f, role_id: role.id }))}
                  >
                    {role.nom}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Enregistrement..."
                  : editingUser ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
