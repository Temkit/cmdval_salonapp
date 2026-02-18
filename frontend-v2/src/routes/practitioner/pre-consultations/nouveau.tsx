import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  Plus,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Patient, QuestionnaireResponseInput } from "@/types";

export const Route = createFileRoute("/practitioner/pre-consultations/nouveau")({
  component: PractitionerPreConsultationNouveau,
});

const TOTAL_STEPS = 8;

const PHOTOTYPES = ["I", "II", "III", "IV", "V", "VI"];
const MARITAL_STATUSES = [
  { value: "celibataire", label: "Celibataire" },
  { value: "marie", label: "Marie(e)" },
];

const HAIR_REMOVAL_METHODS = [
  { value: "razor", label: "Rasoir" },
  { value: "wax", label: "Cire" },
  { value: "cream", label: "Creme depilatoire" },
  { value: "thread", label: "Fil" },
  { value: "tweezers", label: "Pince a epiler" },
  { value: "epilator", label: "Epilateur" },
  { value: "trimmer", label: "Tondeuse" },
  { value: "laser", label: "Laser" },
];

const MEDICAL_CONDITIONS = [
  { key: "epilepsy", label: "Epilepsie" },
  { key: "pcos", label: "SOPK" },
  { key: "hormonal_imbalance", label: "Trouble hormonal" },
  { key: "diabetes", label: "Diabete" },
  { key: "autoimmune", label: "Maladie auto-immune" },
  { key: "keloids", label: "Keloides" },
  { key: "herpes", label: "Herpes" },
  { key: "acne_juvenile", label: "Acne juvenile" },
  { key: "migraine_photosensible", label: "Migraine photosensible" },
  { key: "mycose", label: "Mycose" },
  { key: "hyper_reactivite_cutanee", label: "Hyper-reactivite cutanee" },
  { key: "tumeur_cutanee", label: "Tumeur cutanee" },
];

const DERMA_CONDITIONS = [
  "eczema", "psoriasis", "vitiligo", "acne", "rosacea", "melasma",
];

interface FormZone {
  zone_id: string;
  zone_nom: string;
  is_eligible: boolean;
  observations: string;
}

function PractitionerPreConsultationNouveau() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const editId = searchParams.get("edit");
  const patientIdParam = searchParams.get("patient_id");
  const isEditMode = !!editId;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(isEditMode || patientIdParam ? 1 : 0);
  const [editLoaded, setEditLoaded] = useState(false);
  const [patientParamLoaded, setPatientParamLoaded] = useState(false);

  // Step 0 - Patient
  const [patientSearch, setPatientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({ prenom: "", nom: "", telephone: "", code_carte: "" });
  const [creatingNew, setCreatingNew] = useState(false);

  // Step 1 - Demographics
  const [sexe, setSexe] = useState<"F" | "M">("F");
  const [dateNaissance, setDateNaissance] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [phototype, setPhototype] = useState("");

  // Step 2 - Contraindications (female)
  const [isPregnant, setIsPregnant] = useState(false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  const [pregnancyPlanning, setPregnancyPlanning] = useState(false);

  // Step 3 - Laser history
  const [hasPreviousLaser, setHasPreviousLaser] = useState(false);
  const [clarityII, setClarityII] = useState(false);
  const [laserSessions, setLaserSessions] = useState("");
  const [laserBrand, setLaserBrand] = useState("");
  const [lastLaserDate, setLastLaserDate] = useState("");

  // Step 4 - Medical history
  const [medicalHistory, setMedicalHistory] = useState<Record<string, boolean>>({});
  const [dermaConditions, setDermaConditions] = useState<string[]>([]);
  const [hasCurrentTreatments, setHasCurrentTreatments] = useState(false);
  const [treatmentDetails, setTreatmentDetails] = useState("");
  const [recentPeeling, setRecentPeeling] = useState(false);
  const [recentPeelingDate, setRecentPeelingDate] = useState("");
  const [peelingZone, setPeelingZone] = useState("");

  // Step 5 - Hair removal
  const [hairMethods, setHairMethods] = useState<string[]>([]);

  // Step 6 - Zones
  const [formZones, setFormZones] = useState<FormZone[]>([]);
  const [notes, setNotes] = useState("");

  // Step 7 - Questionnaire
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<string, string | boolean | string[]>>({});

  // Fetch existing pre-consultation for edit mode
  const { data: editData } = useQuery({
    queryKey: ["pre-consultation", editId],
    queryFn: () => api.getPreConsultation(editId!),
    enabled: isEditMode && !editLoaded,
  });

  // Pre-fill form when edit data loads
  useEffect(() => {
    if (!editData || editLoaded) return;
    setSelectedPatient({
      id: editData.patient_id,
      nom: editData.patient_nom || "",
      prenom: editData.patient_prenom || "",
      telephone: editData.patient_telephone || null,
      code_carte: editData.patient_code_carte || null,
    } as Patient);
    setSexe(editData.sexe as "F" | "M");
    if (editData.date_naissance) setDateNaissance(String(editData.date_naissance));
    if (editData.statut_marital) setMaritalStatus(editData.statut_marital);
    if (editData.phototype) setPhototype(editData.phototype);
    setIsPregnant(editData.is_pregnant);
    setIsBreastfeeding(editData.is_breastfeeding);
    setPregnancyPlanning(editData.pregnancy_planning);
    setHasPreviousLaser(editData.has_previous_laser);
    setClarityII(editData.previous_laser_clarity_ii);
    if (editData.previous_laser_sessions) setLaserSessions(String(editData.previous_laser_sessions));
    if (editData.previous_laser_brand) setLaserBrand(editData.previous_laser_brand);
    if (editData.last_laser_date) setLastLaserDate(editData.last_laser_date);
    setMedicalHistory(editData.medical_history || {});
    setDermaConditions(editData.dermatological_conditions || []);
    setHasCurrentTreatments(editData.has_current_treatments);
    if (editData.current_treatments_details) setTreatmentDetails(editData.current_treatments_details);
    setRecentPeeling(editData.recent_peeling);
    if (editData.recent_peeling_date) setRecentPeelingDate(editData.recent_peeling_date);
    if (editData.peeling_zone) setPeelingZone(editData.peeling_zone);
    setHairMethods(editData.hair_removal_methods || []);
    if (editData.notes) setNotes(editData.notes);
    if (editData.zones?.length > 0) {
      setFormZones(editData.zones.map((z) => ({
        zone_id: z.zone_id,
        zone_nom: z.zone_nom || z.zone_id,
        is_eligible: z.is_eligible,
        observations: z.observations || "",
      })));
    }
    setEditLoaded(true);
  }, [editData]);

  // Fetch patient from URL param (when redirected from queue)
  const { data: paramPatientData } = useQuery({
    queryKey: ["patient", patientIdParam],
    queryFn: () => api.getPatient(patientIdParam!),
    enabled: !!patientIdParam && !patientParamLoaded && !isEditMode,
  });

  useEffect(() => {
    if (!paramPatientData || patientParamLoaded) return;
    setSelectedPatient(paramPatientData);
    if (paramPatientData.sexe) setSexe(paramPatientData.sexe);
    if (paramPatientData.date_naissance) setDateNaissance(paramPatientData.date_naissance);
    setPatientParamLoaded(true);
  }, [paramPatientData, patientParamLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(patientSearch), 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const { data: patientsData } = useQuery({
    queryKey: ["patients-search", debouncedSearch],
    queryFn: () => api.getPatients({ q: debouncedSearch, size: 5 }),
    enabled: debouncedSearch.length >= 2 && !selectedPatient,
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const { data: questionsData } = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.getQuestions(),
  });

  const activeQuestions = (questionsData?.questions ?? []).filter((q) => q.is_active).sort((a, b) => a.ordre - b.ordre);

  const generateCardCode = () => {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `OPT-${ymd}-${rand}`;
  };

  const createPatientMutation = useMutation({
    mutationFn: () => api.createPatient({
      prenom: newPatient.prenom,
      nom: newPatient.nom,
      telephone: newPatient.telephone || undefined,
      code_carte: newPatient.code_carte || generateCardCode(),
    }),
    onSuccess: (patient) => {
      setSelectedPatient(patient);
      setCreatingNew(false);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({ title: "Patient cree" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const data: Record<string, unknown> = {
        patient_id: selectedPatient!.id,
        sexe,
        date_naissance: dateNaissance || null,
        phototype: phototype || null,
        statut_marital: maritalStatus || null,
        is_pregnant: isPregnant,
        is_breastfeeding: isBreastfeeding,
        pregnancy_planning: pregnancyPlanning,
        has_previous_laser: hasPreviousLaser,
        previous_laser_clarity_ii: clarityII,
        previous_laser_sessions: laserSessions ? parseInt(laserSessions) : null,
        previous_laser_brand: laserBrand || null,
        last_laser_date: lastLaserDate || null,
        hair_removal_methods: hairMethods,
        medical_history: medicalHistory,
        dermatological_conditions: dermaConditions,
        has_current_treatments: hasCurrentTreatments,
        current_treatments_details: treatmentDetails || null,
        recent_peeling: recentPeeling,
        recent_peeling_date: recentPeelingDate || null,
        peeling_zone: peelingZone || null,
        notes: notes || null,
        zones: formZones.map((z) => ({
          zone_id: z.zone_id,
          is_eligible: z.is_eligible,
          observations: z.observations || null,
        })),
      };
      const result = isEditMode
        ? await api.updatePreConsultation(editId!, data)
        : await api.createPreConsultation(data);

      // Save questionnaire responses if any
      const responses: QuestionnaireResponseInput[] = Object.entries(questionnaireResponses)
        .filter(([_, value]) => value !== "" && value !== null && value !== undefined)
        .map(([questionId, reponse]) => ({
          question_id: questionId,
          reponse,
        }));

      if (responses.length > 0) {
        await api.updatePreConsultationQuestionnaire(result.id, responses);
      }

      // Complete the pre-consultation (single step - no submit/validate)
      await api.completePreConsultation(result.id);

      return result;
    },
    onSuccess: (result: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultations"] });
      queryClient.invalidateQueries({ queryKey: ["pre-consultation", editId] });
      toast({ title: isEditMode ? "Pre-consultation mise a jour" : "Pre-consultation creee" });
      navigate({ to: `/practitioner/pre-consultations/${result.id}` });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const updateZone = (zoneId: string, updates: Partial<FormZone>) => {
    setFormZones((prev) =>
      prev.map((z) => (z.zone_id === zoneId ? { ...z, ...updates } : z)),
    );
  };

  // Initialize all zones when zone data loads
  const allZones = zonesData?.zones ?? [];
  useEffect(() => {
    if (allZones.length > 0 && formZones.length === 0) {
      setFormZones(
        allZones.map((z) => ({
          zone_id: z.id,
          zone_nom: z.nom,
          is_eligible: true,
          observations: "",
        })),
      );
    }
  }, [allZones.length]);

  const canNext = () => {
    switch (step) {
      case 0: return !!selectedPatient;
      case 1: return !!dateNaissance;
      case 6: return true;
      case 7: {
        const requiredQuestions = activeQuestions.filter((q) => q.obligatoire);
        return requiredQuestions.every((q) => {
          const response = questionnaireResponses[q.id];
          if (response === undefined || response === "" || response === null) return false;
          if (Array.isArray(response) && response.length === 0) return false;
          return true;
        });
      }
      default: return true;
    }
  };

  const next = () => {
    if (step === 2 && sexe === "M") {
      setStep(3);
    } else if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  };

  const prev = () => {
    if (step === 3 && sexe === "M") {
      setStep(1);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  const ineligibleCount = formZones.filter((z) => !z.is_eligible).length;

  return (
    <div className="page-container space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/practitioner/pre-consultations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="heading-2">{isEditMode ? "Modifier la pre-consultation" : "Nouvelle pre-consultation"}</h1>
          <p className="text-sm text-muted-foreground">Etape {step + 1} sur {TOTAL_STEPS}</p>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex gap-1.5 justify-center">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 rounded-full transition-all",
              i === step ? "w-6 bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-muted",
            )}
          />
        ))}
      </div>

      {/* Step 0 - Patient Selection/Creation */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPatient ? (
              <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/50">
                <div>
                  <p className="font-medium">{selectedPatient.prenom} {selectedPatient.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPatient.telephone || "Pas de telephone"}
                    {selectedPatient.code_carte && ` · ${selectedPatient.code_carte}`}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                  Changer
                </Button>
              </div>
            ) : creatingNew ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Prenom *</Label>
                    <Input
                      value={newPatient.prenom}
                      onChange={(e) => setNewPatient((p) => ({ ...p, prenom: e.target.value }))}
                      placeholder="Prenom"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nom *</Label>
                    <Input
                      value={newPatient.nom}
                      onChange={(e) => setNewPatient((p) => ({ ...p, nom: e.target.value }))}
                      placeholder="Nom"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Telephone</Label>
                    <Input
                      value={newPatient.telephone}
                      onChange={(e) => setNewPatient((p) => ({ ...p, telephone: e.target.value }))}
                      placeholder="0555..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Code carte</Label>
                    <Input
                      value={newPatient.code_carte}
                      onChange={(e) => setNewPatient((p) => ({ ...p, code_carte: e.target.value }))}
                      placeholder="Optionnel"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCreatingNew(false)}>
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    disabled={!newPatient.prenom || !newPatient.nom || createPatientMutation.isPending}
                    onClick={() => createPatientMutation.mutate()}
                  >
                    {createPatientMutation.isPending ? "Creation..." : "Creer et continuer"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un patient..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-9"
                  />
                  {patientSearch && (
                    <button
                      onClick={() => setPatientSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded hover:bg-muted"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {patientsData?.patients && patientsData.patients.length > 0 && (
                  <div className="space-y-1">
                    {patientsData.patients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearch("");
                          if (p.sexe) setSexe(p.sexe);
                          if (p.date_naissance) setDateNaissance(p.date_naissance);
                        }}
                        className="w-full text-left p-3 rounded-xl border hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-sm font-medium">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-muted-foreground">{p.telephone || "Pas de telephone"}</p>
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="outline" onClick={() => setCreatingNew(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau patient
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1 - Demographics */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Demographiques</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sexe</Label>
              <div className="flex gap-2">
                {(["F", "M"] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={sexe === s ? "default" : "outline"}
                    onClick={() => setSexe(s)}
                    className="flex-1"
                  >
                    {s === "F" ? "Femme" : "Homme"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Statut marital</Label>
              <div className="flex gap-2 flex-wrap">
                {MARITAL_STATUSES.map((s) => (
                  <Button
                    key={s.value}
                    type="button"
                    variant={maritalStatus === s.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMaritalStatus(maritalStatus === s.value ? "" : s.value)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phototype</Label>
              <div className="grid grid-cols-6 gap-2">
                {PHOTOTYPES.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={phototype === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPhototype(phototype === p ? "" : p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 - Contraindications (female only) */}
      {step === 2 && sexe === "F" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Contre-indications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(isPregnant || isBreastfeeding || pregnancyPlanning) && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">
                  Attention : une ou plusieurs contre-indications sont presentes.
                </p>
              </div>
            )}
            {[
              { checked: isPregnant, set: setIsPregnant, label: "Enceinte" },
              { checked: isBreastfeeding, set: setIsBreastfeeding, label: "Allaitement" },
              { checked: pregnancyPlanning, set: setPregnancyPlanning, label: "Projet de grossesse" },
            ].map((item) => (
              <label key={item.label} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.set(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">{item.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3 - Laser History */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Historique laser</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={hasPreviousLaser}
                onChange={(e) => setHasPreviousLaser(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">A deja fait du laser</span>
            </label>
            {hasPreviousLaser && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clarityII}
                    onChange={(e) => setClarityII(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Clarity II</span>
                </label>
                <div className="space-y-1">
                  <Label className="text-xs">Nombre de seances</Label>
                  <Input
                    type="number"
                    value={laserSessions}
                    onChange={(e) => setLaserSessions(e.target.value)}
                    placeholder="Ex: 6"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Marque de l'appareil</Label>
                  <Input
                    value={laserBrand}
                    onChange={(e) => setLaserBrand(e.target.value)}
                    placeholder="Ex: Soprano"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date de la derniere seance laser</Label>
                  <Input
                    value={lastLaserDate}
                    onChange={(e) => setLastLaserDate(e.target.value)}
                    placeholder="Ex: Janvier 2025, il y a 6 mois..."
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4 - Medical History */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Antecedents medicaux</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Conditions medicales</Label>
              <div className="grid grid-cols-2 gap-2">
                {MEDICAL_CONDITIONS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={!!medicalHistory[c.key]}
                      onChange={(e) =>
                        setMedicalHistory((prev) => ({ ...prev, [c.key]: e.target.checked }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conditions dermatologiques</Label>
              <div className="grid grid-cols-2 gap-2">
                {DERMA_CONDITIONS.map((c) => (
                  <label key={c} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={dermaConditions.includes(c)}
                      onChange={(e) =>
                        setDermaConditions((prev) =>
                          e.target.checked ? [...prev, c] : prev.filter((x) => x !== c),
                        )
                      }
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{c}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={hasCurrentTreatments}
                onChange={(e) => setHasCurrentTreatments(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Traitement en cours</span>
            </label>
            {hasCurrentTreatments && (
              <Textarea
                value={treatmentDetails}
                onChange={(e) => setTreatmentDetails(e.target.value)}
                placeholder="Details du traitement..."
                rows={3}
              />
            )}
            <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={recentPeeling}
                onChange={(e) => setRecentPeeling(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Peeling recent</span>
            </label>
            {recentPeeling && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <div className="space-y-1">
                  <Label className="text-xs">Date du peeling</Label>
                  <Input
                    value={recentPeelingDate}
                    onChange={(e) => setRecentPeelingDate(e.target.value)}
                    placeholder="Ex: Decembre 2025, il y a 2 mois..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Zone du peeling</Label>
                  <Input
                    value={peelingZone}
                    onChange={(e) => setPeelingZone(e.target.value)}
                    placeholder="Ex: Visage, mains..."
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5 - Hair Removal */}
      {step === 5 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Methodes d'epilation</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {HAIR_REMOVAL_METHODS.map((m) => (
                <label key={m.value} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={hairMethods.includes(m.value)}
                    onChange={(e) =>
                      setHairMethods((prev) =>
                        e.target.checked ? [...prev, m.value] : prev.filter((x) => x !== m.value),
                      )
                    }
                    className="rounded"
                  />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6 - Zones */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zones ineligibles</CardTitle>
            <p className="text-xs text-muted-foreground">
              Toutes les zones sont eligibles par defaut. Marquez celles qui ne le sont pas.
              {ineligibleCount > 0 && (
                <span className="text-destructive font-medium"> ({ineligibleCount} zone{ineligibleCount > 1 ? "s" : ""} ineligible{ineligibleCount > 1 ? "s" : ""})</span>
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {formZones.length > 0 ? (
              <div className="space-y-3">
                {formZones.map((fz) => (
                  <div
                    key={fz.zone_id}
                    className={cn(
                      "p-3 border rounded-xl space-y-3 transition-colors",
                      !fz.is_eligible && "border-destructive/30 bg-destructive/5",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{fz.zone_nom}</span>
                      <Button
                        type="button"
                        variant={fz.is_eligible ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => updateZone(fz.zone_id, { is_eligible: !fz.is_eligible, observations: fz.is_eligible ? fz.observations : "" })}
                      >
                        {fz.is_eligible ? "Eligible" : "Non eligible"}
                      </Button>
                    </div>
                    {!fz.is_eligible && (
                      <Textarea
                        value={fz.observations}
                        onChange={(e) => updateZone(fz.zone_id, { observations: e.target.value })}
                        placeholder="Raison de non-eligibilite..."
                        rows={2}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chargement des zones...
              </p>
            )}

            <div className="space-y-2">
              <Label>Notes generales</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes supplementaires..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 7 - Questionnaire */}
      {step === 7 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Questionnaire</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {activeQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune question configuree
              </p>
            ) : (
              activeQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {question.texte}
                    {question.obligatoire && <span className="text-destructive">*</span>}
                  </Label>

                  {question.type_reponse === "boolean" && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={questionnaireResponses[question.id] === true ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQuestionnaireResponses((prev) => ({ ...prev, [question.id]: true }))}
                      >
                        Oui
                      </Button>
                      <Button
                        type="button"
                        variant={questionnaireResponses[question.id] === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQuestionnaireResponses((prev) => ({ ...prev, [question.id]: false }))}
                      >
                        Non
                      </Button>
                    </div>
                  )}

                  {question.type_reponse === "text" && (
                    <Textarea
                      value={(questionnaireResponses[question.id] as string) || ""}
                      onChange={(e) => setQuestionnaireResponses((prev) => ({ ...prev, [question.id]: e.target.value }))}
                      placeholder="Votre reponse..."
                      rows={2}
                    />
                  )}

                  {question.type_reponse === "number" && (
                    <Input
                      type="number"
                      value={(questionnaireResponses[question.id] as string) || ""}
                      onChange={(e) => setQuestionnaireResponses((prev) => ({ ...prev, [question.id]: e.target.value }))}
                      placeholder="Votre reponse..."
                    />
                  )}

                  {question.type_reponse === "choice" && question.options && (
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant={questionnaireResponses[question.id] === option ? "default" : "outline"}
                          size="sm"
                          onClick={() => setQuestionnaireResponses((prev) => ({ ...prev, [question.id]: option }))}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}

                  {question.type_reponse === "multiple" && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option) => {
                        const currentValues = (questionnaireResponses[question.id] as string[]) || [];
                        const isChecked = currentValues.includes(option);
                        return (
                          <label key={option} className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setQuestionnaireResponses((prev) => ({
                                  ...prev,
                                  [question.id]: e.target.checked
                                    ? [...currentValues, option]
                                    : currentValues.filter((v) => v !== option),
                                }));
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prev}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Precedent
        </Button>
        {step < TOTAL_STEPS - 1 ? (
          <Button onClick={next} disabled={!canNext()}>
            {step === 6 && activeQuestions.length === 0 ? "Terminer" : "Suivant"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!canNext() || submitMutation.isPending}
          >
            {submitMutation.isPending ? (isEditMode ? "Mise a jour..." : "Enregistrement...") : (isEditMode ? "Enregistrer les modifications" : "Terminer la pre-consultation")}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
