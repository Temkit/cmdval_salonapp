"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { CreatePatientRequest } from "@/types";

export default function NewPatientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    sexe: "" as string,
    date_naissance: "",
    email: "",
    adresse: "",
    phototype: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePatientRequest) => api.createPatient(data),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({ title: "Patient cree" });
      router.push(`/patients/${patient.id}`);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.prenom) {
      toast({ variant: "destructive", title: "Erreur", description: "Nom et prenom sont requis." });
      return;
    }
    createMutation.mutate({
      nom: form.nom,
      prenom: form.prenom,
      telephone: form.telephone || null,
      sexe: (form.sexe as "M" | "F") || null,
      date_naissance: form.date_naissance || null,
      email: form.email || null,
      adresse: form.adresse || null,
      phototype: form.phototype || null,
      notes: form.notes || null,
    });
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/patients">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="heading-2">Nouveau patient</h1>
          <p className="text-sm text-muted-foreground">
            Creer un nouveau dossier patient
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Informations du patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prenom *</Label>
                <Input
                  required
                  value={form.prenom}
                  onChange={(e) => update("prenom", e.target.value)}
                  placeholder="Prenom"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
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
                <Label>Date de naissance</Label>
                <Input
                  type="date"
                  value={form.date_naissance}
                  onChange={(e) => update("date_naissance", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  value={form.adresse}
                  onChange={(e) => update("adresse", e.target.value)}
                  placeholder="Ville, wilaya..."
                />
              </div>
              <div className="space-y-2">
                <Label>Phototype</Label>
                <Select value={form.phototype} onValueChange={(v) => update("phototype", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">I - Tres clair</SelectItem>
                    <SelectItem value="II">II - Clair</SelectItem>
                    <SelectItem value="III">III - Intermediaire</SelectItem>
                    <SelectItem value="IV">IV - Mat</SelectItem>
                    <SelectItem value="V">V - Fonce</SelectItem>
                    <SelectItem value="VI">VI - Tres fonce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={2}
                placeholder="Notes optionnelles..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/patients">Annuler</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creation..." : "Creer le patient"}
          </Button>
        </div>
      </form>
    </div>
  );
}
