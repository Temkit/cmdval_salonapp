import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/patients/nouveau")({
  component: AdminPatientNouveauPage,
});

function AdminPatientNouveauPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    code_carte: "",
    date_naissance: "",
    sexe: "" as "" | "M" | "F",
    email: "",
    adresse: "",
    commune: "",
    wilaya: "",
    phototype: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPatient({
        nom: form.nom,
        prenom: form.prenom,
        code_carte: form.code_carte || undefined,
        telephone: form.telephone || undefined,
        date_naissance: form.date_naissance || undefined,
        sexe: form.sexe || undefined,
        email: form.email || undefined,
        adresse: form.adresse || undefined,
        commune: form.commune || undefined,
        wilaya: form.wilaya || undefined,
        phototype: form.phototype || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: (patient) => {
      toast({ title: "Patient cree avec succes" });
      navigate({ to: "/admin/patients/$id", params: { id: patient.id } });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="page-container space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/admin/patients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="heading-2">Nouveau patient</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations du patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Prenom <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={form.prenom}
                  onChange={(e) => update("prenom", e.target.value)}
                  placeholder="Prenom"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={form.nom}
                  onChange={(e) => update("nom", e.target.value)}
                  placeholder="Nom"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telephone</Label>
                <Input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => update("telephone", e.target.value)}
                  placeholder="0X XX XX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label>Code carte</Label>
                <Input
                  value={form.code_carte}
                  onChange={(e) => update("code_carte", e.target.value)}
                  placeholder="Numero de carte"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de naissance</Label>
                <Input
                  type="date"
                  value={form.date_naissance}
                  onChange={(e) => update("date_naissance", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sexe</Label>
                <Select value={form.sexe} onValueChange={(v) => update("sexe", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Femme</SelectItem>
                    <SelectItem value="M">Homme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phototype</Label>
                <Select
                  value={form.phototype}
                  onValueChange={(v) => update("phototype", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">I - Tres clair</SelectItem>
                    <SelectItem value="II">II - Clair</SelectItem>
                    <SelectItem value="III">III - Moyen</SelectItem>
                    <SelectItem value="IV">IV - Mat</SelectItem>
                    <SelectItem value="V">V - Fonce</SelectItem>
                    <SelectItem value="VI">VI - Tres fonce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={form.adresse}
                onChange={(e) => update("adresse", e.target.value)}
                placeholder="Adresse complete"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commune</Label>
                <Input
                  value={form.commune}
                  onChange={(e) => update("commune", e.target.value)}
                  placeholder="Commune"
                />
              </div>
              <div className="space-y-2">
                <Label>Wilaya</Label>
                <Input
                  value={form.wilaya}
                  onChange={(e) => update("wilaya", e.target.value)}
                  placeholder="Wilaya"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Notes ou observations"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/admin/patients">Annuler</Link>
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={createMutation.isPending || !form.nom || !form.prenom}
          >
            {createMutation.isPending ? "Creation..." : "Creer le patient"}
          </Button>
        </div>
      </form>
    </div>
  );
}
