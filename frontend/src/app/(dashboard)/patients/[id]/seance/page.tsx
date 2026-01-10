"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Zap, Camera, Upload, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const LASER_TYPES = [
  "Alexandrite",
  "Diode",
  "Nd:YAG",
  "IPL",
  "Ruby",
];

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
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
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
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/patients/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouvelle séance</h1>
          <p className="text-muted-foreground">
            {patient.prenom} {patient.nom} - {patient.code_carte}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Zone Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Zone et paramètres laser
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zone */}
            <div className="space-y-2">
              <Label htmlFor="zone">Zone de traitement *</Label>
              {activeZones.length > 0 ? (
                <Select
                  value={formData.patient_zone_id}
                  onValueChange={(v) => handleChange("patient_zone_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeZones.map((zone: any) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        <span className="flex items-center gap-2">
                          {zone.zone_nom}
                          <Badge variant="outline" className="ml-2">
                            {zone.seances_effectuees}/{zone.seances_prevues}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 border rounded-lg bg-muted/50 text-center">
                  <p className="text-muted-foreground mb-2">
                    Aucune zone active disponible
                  </p>
                  <Link href={`/patients/${id}`}>
                    <Button variant="link" size="sm">
                      Ajouter une zone
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Laser Type */}
            <div className="space-y-2">
              <Label htmlFor="type_laser">Type de laser *</Label>
              <Select
                value={formData.type_laser}
                onValueChange={(v) => handleChange("type_laser", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le laser" />
                </SelectTrigger>
                <SelectContent>
                  {LASER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Laser Parameters Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fluence">Fluence (J/cm²)</Label>
                <Input
                  id="fluence"
                  type="number"
                  step="0.1"
                  value={formData.fluence}
                  onChange={(e) => handleChange("fluence", e.target.value)}
                  placeholder="Ex: 25.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequence">Fréquence (Hz)</Label>
                <Input
                  id="frequence"
                  type="number"
                  step="0.1"
                  value={formData.frequence}
                  onChange={(e) => handleChange("frequence", e.target.value)}
                  placeholder="Ex: 10.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duree_impulsion">Durée d'impulsion (ms)</Label>
                <Input
                  id="duree_impulsion"
                  type="number"
                  step="0.1"
                  value={formData.duree_impulsion}
                  onChange={(e) => handleChange("duree_impulsion", e.target.value)}
                  placeholder="Ex: 30.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spot_size">Taille du spot (mm)</Label>
                <Input
                  id="spot_size"
                  type="number"
                  step="0.1"
                  value={formData.spot_size}
                  onChange={(e) => handleChange("spot_size", e.target.value)}
                  placeholder="Ex: 18.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duree_minutes">Durée totale (min)</Label>
                <Input
                  id="duree_minutes"
                  type="number"
                  value={formData.duree_minutes}
                  onChange={(e) => handleChange("duree_minutes", e.target.value)}
                  placeholder="Ex: 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="energie_totale">Énergie totale (J)</Label>
                <Input
                  id="energie_totale"
                  type="number"
                  step="0.1"
                  value={formData.energie_totale}
                  onChange={(e) => handleChange("energie_totale", e.target.value)}
                  placeholder="Ex: 1500.0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observations */}
        <Card>
          <CardHeader>
            <CardTitle>Observations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tolerance">Tolérance du patient</Label>
              <Select
                value={formData.tolerance}
                onValueChange={(v) => handleChange("tolerance", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Évaluer la tolérance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellente">Excellente</SelectItem>
                  <SelectItem value="Bonne">Bonne</SelectItem>
                  <SelectItem value="Moyenne">Moyenne</SelectItem>
                  <SelectItem value="Difficile">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effets_immediats">Effets immédiats</Label>
              <Textarea
                id="effets_immediats"
                value={formData.effets_immediats}
                onChange={(e) => handleChange("effets_immediats", e.target.value)}
                placeholder="Érythème, œdème périfolliculaire..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observations générales</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => handleChange("observations", e.target.value)}
                placeholder="Notes sur le déroulement de la séance..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommandations">Recommandations</Label>
              <Textarea
                id="recommandations"
                value={formData.recommandations}
                onChange={(e) => handleChange("recommandations", e.target.value)}
                placeholder="Consignes post-traitement..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photos (optionnel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Upload Zone */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez ou glissez des photos ici
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 5 photos, 10 Mo chacune
                  </p>
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
                <div className="grid grid-cols-5 gap-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/patients/${id}`}>
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={mutation.isPending || activeZones.length === 0}
          >
            {mutation.isPending ? "Enregistrement..." : "Enregistrer la séance"}
          </Button>
        </div>
      </form>
    </div>
  );
}
