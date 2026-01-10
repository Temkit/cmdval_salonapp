"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function NewPatientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code_carte: "",
    nom: "",
    prenom: "",
    date_naissance: "",
    sexe: "",
    telephone: "",
    email: "",
    adresse: "",
    phototype: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.createPatient(data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({
        title: "Patient créé",
        description: "Le patient a été créé avec succès.",
      });
      router.push(`/patients/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer le patient.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      date_naissance: formData.date_naissance || null,
      sexe: formData.sexe || null,
      phototype: formData.phototype || null,
    };
    mutation.mutate(data);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouveau patient</h1>
          <p className="text-muted-foreground">
            Créez un nouveau dossier patient
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Code carte */}
            <div className="space-y-2">
              <Label htmlFor="code_carte">Code carte *</Label>
              <Input
                id="code_carte"
                value={formData.code_carte}
                onChange={(e) => handleChange("code_carte", e.target.value)}
                placeholder="Scannez ou entrez le code carte"
                required
              />
            </div>

            {/* Nom et Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => handleChange("prenom", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => handleChange("nom", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Date de naissance et Sexe */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_naissance">Date de naissance</Label>
                <Input
                  id="date_naissance"
                  type="date"
                  value={formData.date_naissance}
                  onChange={(e) => handleChange("date_naissance", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexe">Sexe</Label>
                <Select
                  value={formData.sexe}
                  onValueChange={(value) => handleChange("sexe", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Femme</SelectItem>
                    <SelectItem value="M">Homme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Téléphone et Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => handleChange("telephone", e.target.value)}
                  placeholder="06 XX XX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea
                id="adresse"
                value={formData.adresse}
                onChange={(e) => handleChange("adresse", e.target.value)}
                rows={2}
              />
            </div>

            {/* Phototype */}
            <div className="space-y-2">
              <Label htmlFor="phototype">Phototype (Fitzpatrick)</Label>
              <Select
                value={formData.phototype}
                onValueChange={(value) => handleChange("phototype", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le phototype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="I">I - Très claire</SelectItem>
                  <SelectItem value="II">II - Claire</SelectItem>
                  <SelectItem value="III">III - Intermédiaire</SelectItem>
                  <SelectItem value="IV">IV - Mate</SelectItem>
                  <SelectItem value="V">V - Foncée</SelectItem>
                  <SelectItem value="VI">VI - Très foncée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                placeholder="Notes additionnelles..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/patients">
                <Button variant="outline" type="button">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Création..." : "Créer le patient"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
