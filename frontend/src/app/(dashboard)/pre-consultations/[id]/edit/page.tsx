"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Baby, Check, X, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MultiStepForm, StepContent } from "@/components/ui/multi-step-form";
import { ButtonGroup } from "@/components/ui/button-group";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { RequiredFieldLegend } from "@/components/ui/required-legend";
import { Spinner } from "@/components/ui/spinner";
import { useAnnouncer } from "@/components/ui/live-region";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "demographics", title: "Donnees", description: "Informations de base" },
  { id: "contraindications", title: "Contre-indications", description: "Grossesse et allaitement" },
  { id: "laser-history", title: "Historique laser", description: "Traitements precedents" },
  { id: "medical", title: "Medical", description: "Antecedents et traitements" },
  { id: "hair-removal", title: "Epilation", description: "Methodes utilisees" },
  { id: "zones", title: "Zones", description: "Eligibilite par zone" },
];

const HAIR_REMOVAL_METHODS = [
  { id: "razor", label: "Rasoir" },
  { id: "wax", label: "Cire" },
  { id: "cream", label: "Creme depilatoire" },
  { id: "thread", label: "Fil" },
  { id: "tweezers", label: "Pince" },
  { id: "epilator", label: "Epilateur electrique" },
  { id: "trimmer", label: "Tondeuse" },
];

const MEDICAL_CONDITIONS = [
  { id: "epilepsy", label: "Epilepsie" },
  { id: "pcos", label: "SOPK" },
  { id: "hormonal_imbalance", label: "Desequilibre hormonal" },
  { id: "diabetes", label: "Diabete" },
  { id: "autoimmune", label: "Maladie auto-immune" },
  { id: "keloids", label: "Tendance aux cheloides" },
  { id: "herpes", label: "Herpes" },
];

const DERMATOLOGICAL_CONDITIONS = [
  { id: "eczema", label: "Eczema" },
  { id: "psoriasis", label: "Psoriasis" },
  { id: "vitiligo", label: "Vitiligo" },
  { id: "acne", label: "Acne severe" },
  { id: "rosacea", label: "Rosacee" },
  { id: "melasma", label: "Melasma" },
];

const PHOTOTYPES = [
  { value: "I", label: "I - Tres claire" },
  { value: "II", label: "II - Claire" },
  { value: "III", label: "III - Mate" },
  { value: "IV", label: "IV - Foncee" },
  { value: "V", label: "V - Tres foncee" },
  { value: "VI", label: "VI - Noire" },
];

interface FormData {
  sexe: string;
  age: number;
  statut_marital: string;
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  pregnancy_planning: boolean;
  has_previous_laser: boolean;
  previous_laser_clarity_ii: boolean;
  previous_laser_sessions: number | null;
  previous_laser_brand: string;
  hair_removal_methods: string[];
  medical_history: Record<string, boolean>;
  dermatological_conditions: string[];
  has_current_treatments: boolean;
  current_treatments_details: string;
  recent_peeling: boolean;
  phototype: string;
  notes: string;
  zones: { zone_id: string; is_eligible: boolean; observations: string }[];
}

export default function EditPreConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const id = params.id as string;
  const [currentStep, setCurrentStep] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    sexe: "",
    age: 0,
    statut_marital: "",
    is_pregnant: false,
    is_breastfeeding: false,
    pregnancy_planning: false,
    has_previous_laser: false,
    previous_laser_clarity_ii: false,
    previous_laser_sessions: null,
    previous_laser_brand: "",
    hair_removal_methods: [],
    medical_history: {},
    dermatological_conditions: [],
    has_current_treatments: false,
    current_treatments_details: "",
    recent_peeling: false,
    phototype: "",
    notes: "",
    zones: [],
  });

  const { data: pc, isLoading } = useQuery({
    queryKey: ["pre-consultation", id],
    queryFn: () => api.getPreConsultation(id),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  // Populate form when data loads
  useEffect(() => {
    if (pc && !initialized) {
      setFormData({
        sexe: pc.sexe || "",
        age: pc.age || 0,
        statut_marital: pc.statut_marital || "",
        is_pregnant: pc.is_pregnant || false,
        is_breastfeeding: pc.is_breastfeeding || false,
        pregnancy_planning: pc.pregnancy_planning || false,
        has_previous_laser: pc.has_previous_laser || false,
        previous_laser_clarity_ii: pc.previous_laser_clarity_ii || false,
        previous_laser_sessions: pc.previous_laser_sessions || null,
        previous_laser_brand: pc.previous_laser_brand || "",
        hair_removal_methods: pc.hair_removal_methods || [],
        medical_history: pc.medical_history || {},
        dermatological_conditions: pc.dermatological_conditions || [],
        has_current_treatments: pc.has_current_treatments || false,
        current_treatments_details: pc.current_treatments_details || "",
        recent_peeling: pc.recent_peeling || false,
        phototype: pc.phototype || "",
        notes: pc.notes || "",
        zones: pc.zones?.map((z: any) => ({
          zone_id: z.zone_id,
          is_eligible: z.is_eligible,
          observations: z.observations || "",
        })) || [],
      });
      setInitialized(true);
    }
  }, [pc, initialized]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updatePreConsultation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultation", id] });
      queryClient.invalidateQueries({ queryKey: ["pre-consultations"] });
      toast({ title: "Pre-consultation mise a jour" });
      router.push(`/pre-consultations/${id}`);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: error.message || "Erreur lors de la mise a jour" });
    },
  });

  const { announce, Announcer } = useAnnouncer();

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleHairMethod = (methodId: string) => {
    setFormData((prev) => ({
      ...prev,
      hair_removal_methods: prev.hair_removal_methods.includes(methodId)
        ? prev.hair_removal_methods.filter((m) => m !== methodId)
        : [...prev.hair_removal_methods, methodId],
    }));
  };

  const toggleMedicalCondition = (conditionId: string) => {
    setFormData((prev) => ({
      ...prev,
      medical_history: {
        ...prev.medical_history,
        [conditionId]: !prev.medical_history[conditionId],
      },
    }));
  };

  const toggleDermatologicalCondition = (conditionId: string) => {
    setFormData((prev) => ({
      ...prev,
      dermatological_conditions: prev.dermatological_conditions.includes(conditionId)
        ? prev.dermatological_conditions.filter((c) => c !== conditionId)
        : [...prev.dermatological_conditions, conditionId],
    }));
  };

  const addZone = (zoneId: string) => {
    if (!formData.zones.find((z) => z.zone_id === zoneId)) {
      setFormData((prev) => ({
        ...prev,
        zones: [...prev.zones, { zone_id: zoneId, is_eligible: true, observations: "" }],
      }));
      const zoneName = zonesData?.zones?.find((z: any) => z.id === zoneId)?.nom;
      if (zoneName) announce(`Zone ${zoneName} ajoutee`);
    }
  };

  const removeZone = (zoneId: string) => {
    const zoneName = zonesData?.zones?.find((z: any) => z.id === zoneId)?.nom;
    setFormData((prev) => ({
      ...prev,
      zones: prev.zones.filter((z) => z.zone_id !== zoneId),
    }));
    if (zoneName) announce(`Zone ${zoneName} retiree`);
  };

  const updateZone = (zoneId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      zones: prev.zones.map((z) =>
        z.zone_id === zoneId ? { ...z, [field]: value } : z
      ),
    }));
  };

  const canProceed = (): boolean => {
    if (currentStep === 0) return !!formData.sexe && formData.age > 0;
    return true;
  };

  const handleSubmit = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading || !initialized) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 skeleton" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 skeleton rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pc) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium">Pre-consultation non trouvee</p>
        <Button asChild className="mt-4">
          <a href="/pre-consultations">Retour a la liste</a>
        </Button>
      </div>
    );
  }

  if (pc.status !== "draft") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium">Cette pre-consultation ne peut plus etre modifiee</p>
        <p className="text-sm text-muted-foreground mt-1">Seuls les brouillons peuvent etre edites.</p>
        <Button asChild className="mt-4">
          <a href={`/pre-consultations/${id}`}>Retour au detail</a>
        </Button>
      </div>
    );
  }

  const hasContraindications = formData.is_pregnant || formData.is_breastfeeding;
  const availableZones = zonesData?.zones?.filter(
    (z: any) => z.is_active && !formData.zones.find((fz) => fz.zone_id === z.id)
  ) || [];

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      <div className="space-y-2">
        <Breadcrumbs items={[
          { label: "Pre-consultations", href: "/pre-consultations" },
          { label: "Detail", href: `/pre-consultations/${id}` },
          { label: "Modifier" },
        ]} />
        <h1 className="heading-2">Modifier la pre-consultation</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Modifier les informations de la pre-consultation</p>
          <RequiredFieldLegend />
        </div>
      </div>

      <MultiStepForm
        steps={STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        canProceed={canProceed()}
        submitLabel="Enregistrer les modifications"
      >
        {/* Step 0: Demographics */}
        <StepContent step={0} currentStep={currentStep}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Sexe *</Label>
                <ButtonGroup
                  options={[
                    { value: "F", label: "Femme" },
                    { value: "M", label: "Homme" },
                  ]}
                  value={formData.sexe}
                  onChange={(v) => updateField("sexe", v)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Age *</Label>
                <Input
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) => updateField("age", parseInt(e.target.value) || 0)}
                  placeholder="Age du patient"
                  min={0}
                  max={120}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Statut marital</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {[
                    { value: "celibataire", label: "Celibataire" },
                    { value: "marie", label: "Marie(e)" },
                    { value: "divorce", label: "Divorce(e)" },
                    { value: "veuf", label: "Veuf/Veuve" },
                  ].map((s) => (
                    <Button
                      key={s.value}
                      type="button"
                      variant={formData.statut_marital === s.value ? "default" : "outline"}
                      onClick={() => updateField("statut_marital", s.value)}
                      className="h-12"
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Phototype</Label>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mt-1.5">
                  {PHOTOTYPES.map((pt) => (
                    <Button
                      key={pt.value}
                      type="button"
                      variant={formData.phototype === pt.value ? "default" : "outline"}
                      onClick={() => updateField("phototype", pt.value)}
                      className="h-12"
                    >
                      {pt.value}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </StepContent>

        {/* Step 1: Contraindications */}
        <StepContent step={1} currentStep={currentStep}>
          {formData.sexe === "F" ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Baby className="h-5 w-5" />
                  Contre-indications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasContraindications && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-semibold text-destructive">Contre-indication detectee</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Le traitement laser est deconseille pendant la grossesse et l'allaitement.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <span className="font-medium">Enceinte</span>
                    <input
                      type="checkbox"
                      checked={formData.is_pregnant}
                      onChange={(e) => updateField("is_pregnant", e.target.checked)}
                      className="h-5 w-5 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <span className="font-medium">Allaitement</span>
                    <input
                      type="checkbox"
                      checked={formData.is_breastfeeding}
                      onChange={(e) => updateField("is_breastfeeding", e.target.checked)}
                      className="h-5 w-5 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <span className="font-medium">Projet de grossesse</span>
                    <input
                      type="checkbox"
                      checked={formData.pregnancy_planning}
                      onChange={(e) => updateField("pregnancy_planning", e.target.checked)}
                      className="h-5 w-5 rounded"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                  <p>Cette section ne s'applique pas aux patients masculins.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setCurrentStep(2)}>
                    Passer a l'etape suivante
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </StepContent>

        {/* Step 2: Laser History */}
        <StepContent step={2} currentStep={currentStep}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historique des traitements laser</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="font-medium">Traitement laser precedent</span>
                <input
                  type="checkbox"
                  checked={formData.has_previous_laser}
                  onChange={(e) => updateField("has_previous_laser", e.target.checked)}
                  className="h-5 w-5"
                />
              </label>

              {formData.has_previous_laser && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <span className="font-medium">Avec Clarity II</span>
                    <input
                      type="checkbox"
                      checked={formData.previous_laser_clarity_ii}
                      onChange={(e) => updateField("previous_laser_clarity_ii", e.target.checked)}
                      className="h-5 w-5"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Nombre de seances</Label>
                      <Input
                        type="number"
                        value={formData.previous_laser_sessions || ""}
                        onChange={(e) => updateField("previous_laser_sessions", parseInt(e.target.value) || null)}
                        placeholder="Ex: 6"
                        min={0}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Marque du laser</Label>
                      <Input
                        value={formData.previous_laser_brand}
                        onChange={(e) => updateField("previous_laser_brand", e.target.value)}
                        placeholder="Ex: Candela"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </StepContent>

        {/* Step 3: Medical History */}
        <StepContent step={3} currentStep={currentStep}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Antecedents medicaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-base">Antecedents medicaux et chirurgicaux</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {MEDICAL_CONDITIONS.map((condition) => (
                    <label
                      key={condition.id}
                      className={cn(
                        "flex items-center gap-3 p-3 min-h-[48px] border rounded-xl cursor-pointer transition-colors",
                        formData.medical_history[condition.id]
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={formData.medical_history[condition.id] || false}
                        onChange={() => toggleMedicalCondition(condition.id)}
                        className="h-5 w-5"
                      />
                      <span className="text-sm">{condition.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base">Maladies dermatologiques</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {DERMATOLOGICAL_CONDITIONS.map((condition) => (
                    <label
                      key={condition.id}
                      className={cn(
                        "flex items-center gap-3 p-3 min-h-[48px] border rounded-xl cursor-pointer transition-colors",
                        formData.dermatological_conditions.includes(condition.id)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={formData.dermatological_conditions.includes(condition.id)}
                        onChange={() => toggleDermatologicalCondition(condition.id)}
                        className="h-5 w-5"
                      />
                      <span className="text-sm">{condition.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                  <span className="font-medium">Traitements en cours</span>
                  <input
                    type="checkbox"
                    checked={formData.has_current_treatments}
                    onChange={(e) => updateField("has_current_treatments", e.target.checked)}
                    className="h-5 w-5"
                  />
                </label>

                {formData.has_current_treatments && (
                  <div>
                    <Label>Details des traitements</Label>
                    <Textarea
                      value={formData.current_treatments_details}
                      onChange={(e) => updateField("current_treatments_details", e.target.value)}
                      placeholder="Listez les medicaments et traitements actuels..."
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>
                )}

                <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                  <span className="font-medium">Peeling recent (moins de 3 mois)</span>
                  <input
                    type="checkbox"
                    checked={formData.recent_peeling}
                    onChange={(e) => updateField("recent_peeling", e.target.checked)}
                    className="h-5 w-5"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </StepContent>

        {/* Step 4: Hair Removal Methods */}
        <StepContent step={4} currentStep={currentStep}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Methodes d'epilation utilisees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HAIR_REMOVAL_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={cn(
                      "flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors",
                      formData.hair_removal_methods.includes(method.id)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.hair_removal_methods.includes(method.id)}
                      onChange={() => toggleHairMethod(method.id)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{method.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </StepContent>

        {/* Step 5: Zone Eligibility */}
        <StepContent step={5} currentStep={currentStep}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Eligibilite des zones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.zones.length > 0 && (
                <div className="space-y-3">
                  {formData.zones.map((zone) => {
                    const zoneInfo = zonesData?.zones?.find((z: any) => z.id === zone.zone_id);
                    return (
                      <div
                        key={zone.zone_id}
                        className={cn(
                          "p-4 border rounded-xl transition-colors duration-200",
                          zone.is_eligible ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : "border-destructive/30 bg-destructive/10"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{zoneInfo?.nom || zone.zone_id}</span>
                              <Badge variant={zone.is_eligible ? "outline" : "destructive"} className="gap-1">
                                {zone.is_eligible ? <><Check className="h-3 w-3" />Eligible</> : <><X className="h-3 w-3" />Non eligible</>}
                              </Badge>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <Button type="button" variant={zone.is_eligible ? "default" : "outline"} size="sm" onClick={() => updateZone(zone.zone_id, "is_eligible", true)}>
                                <Check className="h-4 w-4 mr-1" />Oui
                              </Button>
                              <Button type="button" variant={!zone.is_eligible ? "destructive" : "outline"} size="sm" onClick={() => updateZone(zone.zone_id, "is_eligible", false)}>
                                <X className="h-4 w-4 mr-1" />Non
                              </Button>
                            </div>
                            {!zone.is_eligible && (
                              <Textarea
                                value={zone.observations}
                                onChange={(e) => updateZone(zone.zone_id, "observations", e.target.value)}
                                placeholder="Raison de la non-eligibilite..."
                                className="mt-2"
                                rows={2}
                              />
                            )}
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeZone(zone.zone_id)} className="shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {availableZones.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Ajouter une zone</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableZones.map((zone: any) => (
                      <Button key={zone.id} type="button" variant="outline" size="sm" onClick={() => addZone(zone.id)} className="gap-1">
                        <Plus className="h-3 w-3" />{zone.nom}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {formData.zones.length === 0 && availableZones.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucune zone disponible. Configurez les zones dans les parametres.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Notes supplementaires..."
                rows={3}
              />
            </CardContent>
          </Card>
        </StepContent>
      </MultiStepForm>
      <Announcer mode="polite" />
    </div>
  );
}
