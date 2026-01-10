"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Phone, Mail, MapPin, ScanLine } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonGroup } from "@/components/ui/button-group";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const SEXE_OPTIONS = [
  { value: "F", label: "Femme" },
  { value: "M", label: "Homme" },
];

const PHOTOTYPE_OPTIONS = [
  { value: "I", label: "I", description: "Très claire" },
  { value: "II", label: "II", description: "Claire" },
  { value: "III", label: "III", description: "Intermédiaire" },
  { value: "IV", label: "IV", description: "Mate" },
  { value: "V", label: "V", description: "Foncée" },
  { value: "VI", label: "VI", description: "Très foncée" },
];

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

  const [showOptional, setShowOptional] = useState(false);

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
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/patients">
          <Button variant="ghost" size="icon" className="h-12 w-12">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Nouveau patient</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Code carte - Priority field */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Code carte
              </Label>
              <Input
                value={formData.code_carte}
                onChange={(e) => handleChange("code_carte", e.target.value)}
                placeholder="Scannez ou tapez le code"
                className="h-14 text-lg"
                required
                autoFocus
              />
            </div>
          </CardContent>
        </Card>

        {/* Identity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Identité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-base">Prénom</Label>
                <Input
                  value={formData.prenom}
                  onChange={(e) => handleChange("prenom", e.target.value)}
                  className="h-14 text-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Nom</Label>
                <Input
                  value={formData.nom}
                  onChange={(e) => handleChange("nom", e.target.value)}
                  className="h-14 text-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base">Sexe</Label>
              <ButtonGroup
                options={SEXE_OPTIONS}
                value={formData.sexe}
                onChange={(v) => handleChange("sexe", v)}
                size="lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">Date de naissance</Label>
              <Input
                type="date"
                value={formData.date_naissance}
                onChange={(e) => handleChange("date_naissance", e.target.value)}
                className="h-14 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base">Téléphone</Label>
              <Input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleChange("telephone", e.target.value)}
                placeholder="06 XX XX XX XX"
                className="h-14 text-lg"
                inputMode="tel"
              />
            </div>
          </CardContent>
        </Card>

        {/* Phototype - Visual selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Phototype (Fitzpatrick)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {PHOTOTYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange("phototype", option.value)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95
                    ${formData.phototype === option.value
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  <div
                    className="w-10 h-10 rounded-full mb-2 border"
                    style={{
                      backgroundColor: {
                        I: "#FFE4D6",
                        II: "#F5D6C6",
                        III: "#DEB887",
                        IV: "#C4A47B",
                        V: "#8B6914",
                        VI: "#4A3000",
                      }[option.value],
                    }}
                  />
                  <span className="font-bold text-lg">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Optional fields toggle */}
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="w-full py-3 text-center text-muted-foreground border-2 border-dashed rounded-lg hover:border-primary/50 hover:text-foreground transition-colors"
        >
          {showOptional ? "Masquer" : "Afficher"} les champs optionnels
        </button>

        {/* Optional fields */}
        {showOptional && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Informations complémentaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="h-14 text-lg"
                  inputMode="email"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base">Adresse</Label>
                <Input
                  value={formData.adresse}
                  onChange={(e) => handleChange("adresse", e.target.value)}
                  className="h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base">Notes</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border-2 border-border p-4 text-lg resize-none focus:border-primary focus:outline-none"
                  placeholder="Notes additionnelles..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions - Fixed at bottom */}
        <div className="sticky bottom-4 flex gap-3 pt-4">
          <Link href="/patients" className="flex-1">
            <Button variant="outline" type="button" className="w-full h-14 text-lg">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 h-14 text-lg"
          >
            {mutation.isPending ? "Création..." : "Créer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
