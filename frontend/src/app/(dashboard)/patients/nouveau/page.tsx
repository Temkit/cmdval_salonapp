"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Phone, ScanLine, Palette } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { MultiStepForm, StepContent } from "@/components/ui/multi-step-form";
import { ButtonGroup } from "@/components/ui/button-group";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation } from "@/hooks/use-form-validation";
import { api } from "@/lib/api";

const STEPS = [
  { id: "carte", title: "Carte", description: "Code carte du patient" },
  { id: "identite", title: "Identité", description: "Informations personnelles" },
  { id: "contact", title: "Contact", description: "Coordonnées" },
  { id: "medical", title: "Médical", description: "Informations médicales" },
];

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

const PHOTOTYPE_COLORS: Record<string, string> = {
  I: "#FFE4D6",
  II: "#F5D6C6",
  III: "#DEB887",
  IV: "#C4A47B",
  V: "#8B6914",
  VI: "#4A3000",
};

interface FormData {
  code_carte: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: string;
  telephone: string;
  email: string;
  adresse: string;
  phototype: string;
  notes: string;
}

export default function NewPatientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState<FormData>({
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

  // Validation schema
  const validation = useFormValidation<FormData>({
    code_carte: { rules: { required: true, minLength: 3 }, message: "Code carte requis (min 3 caractères)" },
    nom: { rules: { required: true, minLength: 2 }, message: "Nom requis" },
    prenom: { rules: { required: true, minLength: 2 }, message: "Prénom requis" },
    date_naissance: { rules: {} },
    sexe: { rules: {} },
    telephone: { rules: { phone: true }, message: "Numéro invalide" },
    email: { rules: { email: true }, message: "Email invalide" },
    adresse: { rules: {} },
    phototype: { rules: {} },
    notes: { rules: {} },
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

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Validate on change after field has been touched
    if (validation.touched[field]) {
      const error = validation.validateField(field, value);
      // Update errors state would happen through validateField
    }
  };

  const handleBlur = (field: keyof FormData) => {
    validation.setFieldTouched(field);
    validation.validateField(field, formData[field]);
  };

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case 0: // Carte
        return formData.code_carte.length >= 3;
      case 1: // Identité
        return formData.nom.length >= 2 && formData.prenom.length >= 2;
      case 2: // Contact
        return true; // Optional step
      case 3: // Medical
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    if (!validation.validateAll(formData)) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs avant de continuer.",
      });
      return;
    }

    // Convert empty strings to null for optional fields
    const data = {
      code_carte: formData.code_carte,
      nom: formData.nom,
      prenom: formData.prenom,
      date_naissance: formData.date_naissance || null,
      sexe: formData.sexe || null,
      telephone: formData.telephone || null,
      email: formData.email || null,
      adresse: formData.adresse || null,
      phototype: formData.phototype || null,
      notes: formData.notes || null,
    };
    mutation.mutate(data);
  };

  const getFieldState = (field: keyof FormData) => validation.getFieldState(field);

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/patients">
          <Button variant="ghost" size="icon" className="h-12 w-12">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="heading-2">Nouveau patient</h1>
      </div>

      <MultiStepForm
        steps={STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onSubmit={handleSubmit}
        isSubmitting={mutation.isPending}
        canProceed={canProceedToNext()}
        submitLabel="Créer le patient"
      >
        {/* Step 1: Code Carte */}
        <StepContent step={0} currentStep={currentStep}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-4 flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Code carte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                label="Code carte"
                value={formData.code_carte}
                onChange={(e) => handleChange("code_carte", e.target.value)}
                onBlur={() => handleBlur("code_carte")}
                placeholder="Scannez ou tapez le code"
                required
                error={getFieldState("code_carte").error}
                touched={getFieldState("code_carte").touched}
                showSuccess
                helperText="Scannez la carte patient ou entrez le code manuellement"
                autoFocus
              />
            </CardContent>
          </Card>
        </StepContent>

        {/* Step 2: Identité */}
        <StepContent step={1} currentStep={currentStep}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Identité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Prénom"
                value={formData.prenom}
                onChange={(e) => handleChange("prenom", e.target.value)}
                onBlur={() => handleBlur("prenom")}
                required
                error={getFieldState("prenom").error}
                touched={getFieldState("prenom").touched}
                showSuccess
              />

              <FormField
                label="Nom"
                value={formData.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                onBlur={() => handleBlur("nom")}
                required
                error={getFieldState("nom").error}
                touched={getFieldState("nom").touched}
                showSuccess
              />

              <div className="space-y-2">
                <label className="text-base font-medium">
                  Sexe <span className="text-muted-foreground text-sm font-normal">(optionnel)</span>
                </label>
                <ButtonGroup
                  options={SEXE_OPTIONS}
                  value={formData.sexe}
                  onChange={(v) => handleChange("sexe", v)}
                  size="lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">
                  Date de naissance <span className="text-muted-foreground text-sm font-normal">(optionnel)</span>
                </label>
                <DatePicker
                  value={formData.date_naissance}
                  onChange={(v) => handleChange("date_naissance", v)}
                  placeholder="Sélectionner la date de naissance"
                />
              </div>
            </CardContent>
          </Card>
        </StepContent>

        {/* Step 3: Contact */}
        <StepContent step={2} currentStep={currentStep}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-4 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Coordonnées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Téléphone"
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleChange("telephone", e.target.value)}
                onBlur={() => handleBlur("telephone")}
                placeholder="06 XX XX XX XX"
                inputMode="tel"
                optional
                error={getFieldState("telephone").error}
                touched={getFieldState("telephone").touched}
                showSuccess
              />

              <FormField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                inputMode="email"
                optional
                error={getFieldState("email").error}
                touched={getFieldState("email").touched}
                showSuccess
              />

              <FormField
                label="Adresse"
                value={formData.adresse}
                onChange={(e) => handleChange("adresse", e.target.value)}
                optional
              />
            </CardContent>
          </Card>
        </StepContent>

        {/* Step 4: Medical */}
        <StepContent step={3} currentStep={currentStep}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-4 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Informations médicales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-base font-medium">
                  Phototype (Fitzpatrick) <span className="text-muted-foreground text-sm font-normal">(optionnel)</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PHOTOTYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange("phototype", option.value)}
                      className={`
                        flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95 min-h-[88px]
                        ${formData.phototype === option.value
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:border-primary/50"
                        }
                      `}
                    >
                      <div
                        className="w-10 h-10 rounded-full mb-2 border"
                        style={{ backgroundColor: PHOTOTYPE_COLORS[option.value] }}
                      />
                      <span className="font-bold text-lg">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <FormTextarea
                label="Notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                optional
                helperText="Notes additionnelles sur le patient"
              />
            </CardContent>
          </Card>
        </StepContent>
      </MultiStepForm>
    </div>
  );
}
