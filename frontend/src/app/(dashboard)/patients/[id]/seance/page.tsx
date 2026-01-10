"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Zap, Camera, Upload, X, Clock, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ButtonGroup, ZoneCard, NumberStepper } from "@/components/ui/button-group";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const LASER_TYPES = [
  { value: "Alexandrite", label: "Alexandrite" },
  { value: "Diode", label: "Diode" },
  { value: "Nd:YAG", label: "Nd:YAG" },
  { value: "IPL", label: "IPL" },
];

const TOLERANCE_OPTIONS = [
  { value: "Excellente", label: "Excellente" },
  { value: "Bonne", label: "Bonne" },
  { value: "Moyenne", label: "Moyenne" },
  { value: "Difficile", label: "Difficile" },
];

const EFFETS_OPTIONS = [
  { value: "RAS", label: "RAS" },
  { value: "Érythème léger", label: "Érythème" },
  { value: "Œdème périfolliculaire", label: "Œdème" },
  { value: "Rougeur modérée", label: "Rougeur" },
];

const FLUENCE_PRESETS = [15, 20, 25, 30, 35, 40];
const SPOT_PRESETS = [8, 10, 12, 15, 18];
const DUREE_PRESETS = [15, 20, 30, 45, 60];

export default function NewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    patient_zone_id: "",
    type_laser: "",
    fluence: "",
    frequence: "",
    duree_impulsion: "",
    spot_size: "",
    duree_minutes: "",
    energie_totale: "",
    observations: "",
    tolerance: "",
    effets_immediats: "",
    recommandations: "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(id),
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.createSession(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      queryClient.invalidateQueries({ queryKey: ["patient-sessions", id] });
      toast({
        title: "Séance créée",
        description: "La séance a été enregistrée avec succès.",
      });
      router.push(`/patients/${id}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer la séance.",
      });
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      toast({
        variant: "destructive",
        title: "Limite atteinte",
        description: "Maximum 5 photos par séance.",
      });
      return;
    }

    setPhotos((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_zone_id) {
      toast({
        variant: "destructive",
        title: "Zone requise",
        description: "Veuillez sélectionner une zone de traitement.",
      });
      return;
    }

    if (!formData.type_laser) {
      toast({
        variant: "destructive",
        title: "Type de laser requis",
        description: "Veuillez sélectionner un type de laser.",
      });
      return;
    }

    const data = new FormData();
    data.append("patient_zone_id", formData.patient_zone_id);
    data.append("type_laser", formData.type_laser);

    if (formData.fluence) data.append("fluence", formData.fluence);
    if (formData.frequence) data.append("frequence", formData.frequence);
    if (formData.duree_impulsion) data.append("duree_impulsion", formData.duree_impulsion);
    if (formData.spot_size) data.append("spot_size", formData.spot_size);
    if (formData.duree_minutes) data.append("duree_minutes", formData.duree_minutes);
    if (formData.energie_totale) data.append("energie_totale", formData.energie_totale);
    if (formData.observations) data.append("observations", formData.observations);
    if (formData.tolerance) data.append("tolerance", formData.tolerance);
    if (formData.effets_immediats) data.append("effets_immediats", formData.effets_immediats);
    if (formData.recommandations) data.append("recommandations", formData.recommandations);

    photos.forEach((photo) => {
      data.append("photos", photo);
    });

    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient non trouvé</p>
        <Link href="/patients">
          <Button variant="link">Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  const activeZones = patient.zones?.filter(
    (z: any) => z.seances_restantes > 0
  ) || [];

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/patients/${id}`}>
          <Button variant="ghost" size="icon" className="h-12 w-12">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="heading-2">Nouvelle séance</h1>
          <p className="text-secondary">
            {patient.prenom} {patient.nom}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Zone Selection - Card based */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Zone de traitement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeZones.length > 0 ? (
              <div className="grid gap-3">
                {activeZones.map((zone: any) => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    selected={formData.patient_zone_id === zone.id}
                    onSelect={() => handleChange("patient_zone_id", zone.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed rounded-lg text-center">
                <p className="text-muted-foreground mb-3">
                  Aucune zone active disponible
                </p>
                <Link href={`/patients/${id}`}>
                  <Button variant="outline">Ajouter une zone</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Laser Type - Button Group */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Type de laser</CardTitle>
          </CardHeader>
          <CardContent>
            <ButtonGroup
              options={LASER_TYPES}
              value={formData.type_laser}
              onChange={(v) => handleChange("type_laser", v)}
              columns={4}
              size="lg"
            />
          </CardContent>
        </Card>

        {/* Quick Parameters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Paramètres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fluence with presets */}
            <div className="space-y-2">
              <Label className="text-base">Fluence (J/cm²)</Label>
              <div className="flex flex-wrap gap-2">
                {FLUENCE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleChange("fluence", preset.toString())}
                    className={`
                      min-h-[52px] min-w-[52px] px-4 rounded-xl border-2 font-semibold text-lg transition-all active:scale-95
                      ${formData.fluence === preset.toString()
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                      }
                    `}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Spot Size with presets */}
            <div className="space-y-2">
              <Label className="text-base">Spot (mm)</Label>
              <div className="flex flex-wrap gap-2">
                {SPOT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleChange("spot_size", preset.toString())}
                    className={`
                      min-h-[52px] min-w-[52px] px-4 rounded-xl border-2 font-semibold text-lg transition-all active:scale-95
                      ${formData.spot_size === preset.toString()
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                      }
                    `}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration with presets */}
            <div className="space-y-2">
              <Label className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Durée (min)
              </Label>
              <div className="flex flex-wrap gap-2">
                {DUREE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleChange("duree_minutes", preset.toString())}
                    className={`
                      min-h-[52px] min-w-[52px] px-4 rounded-xl border-2 font-semibold text-lg transition-all active:scale-95
                      ${formData.duree_minutes === preset.toString()
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                      }
                    `}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced parameters toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-3 text-center text-muted-foreground border-2 border-dashed rounded-lg hover:border-primary/50 hover:text-foreground transition-colors"
        >
          {showAdvanced ? "Masquer" : "Afficher"} les paramètres avancés
        </button>

        {showAdvanced && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base">Fréquence (Hz)</Label>
                  <NumberStepper
                    value={formData.frequence}
                    onChange={(v) => handleChange("frequence", v)}
                    min={1}
                    max={20}
                    step={1}
                    presets={[1, 2, 3, 5, 10]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Impulsion (ms)</Label>
                  <NumberStepper
                    value={formData.duree_impulsion}
                    onChange={(v) => handleChange("duree_impulsion", v)}
                    min={1}
                    max={100}
                    step={5}
                    presets={[10, 20, 30, 50]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tolerance - Button Group */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tolérance</CardTitle>
          </CardHeader>
          <CardContent>
            <ButtonGroup
              options={TOLERANCE_OPTIONS}
              value={formData.tolerance}
              onChange={(v) => handleChange("tolerance", v)}
              columns={4}
              size="md"
            />
          </CardContent>
        </Card>

        {/* Immediate Effects - Button Group */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Effets immédiats</CardTitle>
          </CardHeader>
          <CardContent>
            <ButtonGroup
              options={EFFETS_OPTIONS}
              value={formData.effets_immediats}
              onChange={(v) => handleChange("effets_immediats", v)}
              columns={4}
              size="md"
            />
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Upload Zone */}
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-muted-foreground">Ajouter des photos</span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                />
              </label>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes - Only if needed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notes (optionnel)</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.observations}
              onChange={(e) => handleChange("observations", e.target.value)}
              rows={2}
              className="w-full rounded-lg border-2 border-border p-4 text-lg resize-none focus:border-primary focus:outline-none"
              placeholder="Observations..."
            />
          </CardContent>
        </Card>

        {/* Actions - Fixed at bottom */}
        <div className="sticky bottom-4 flex gap-3 pt-4">
          <Link href={`/patients/${id}`} className="flex-1">
            <Button variant="outline" type="button" className="w-full h-14 text-lg">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={mutation.isPending || activeZones.length === 0}
            className="flex-1 h-14 text-lg"
          >
            {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
