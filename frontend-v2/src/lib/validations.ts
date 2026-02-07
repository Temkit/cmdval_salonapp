import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const createPatientSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prenom requis"),
  telephone: z
    .string()
    .regex(/^(\+?\d{1,4})?[\s.-]?\(?\d{1,}\)?[\s.-]?\d{1,}[\s.-]?\d{1,}$/, "Numero de telephone invalide")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  code_carte: z.string().optional(),
  date_naissance: z.string().optional().or(z.literal("")),
  sexe: z.enum(["M", "F"]).optional().nullable(),
  adresse: z.string().optional(),
  notes: z.string().optional(),
  phototype: z.string().optional(),
});

export const createZoneSchema = z.object({
  code: z.string().min(1, "Code requis").max(20, "Code trop long"),
  nom: z.string().min(1, "Nom requis"),
  description: z.string().optional().nullable(),
  prix: z.number().positive("Le prix doit etre positif").optional().nullable(),
  duree_minutes: z.number().int().positive().optional().nullable(),
  categorie: z
    .enum(["visage", "bras", "jambes", "corps", "homme"])
    .optional()
    .nullable(),
  ordre: z.number().int().optional(),
  is_homme: z.boolean().optional(),
});

export const createRoleSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  permissions: z
    .array(z.string())
    .min(1, "Au moins une permission requise"),
});

export const createQuestionSchema = z.object({
  texte: z.string().min(1, "Texte de la question requis"),
  type_reponse: z.enum(["boolean", "text", "choice", "multiple", "number"]),
  options: z.array(z.string()).optional().nullable(),
  ordre: z.number().int().optional(),
  obligatoire: z.boolean().optional(),
});

export const createPackSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  description: z.string().optional().nullable(),
  zone_ids: z.array(z.string()).min(1, "Au moins une zone requise"),
  prix: z.number().positive("Le prix doit etre positif"),
  duree_jours: z.number().int().positive().optional().nullable(),
  seances_per_zone: z
    .number()
    .int()
    .min(1, "Au moins une seance par zone"),
});

export const createPromotionSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  type: z.enum(["pourcentage", "montant"]),
  valeur: z.number().positive("La valeur doit etre positive"),
  zone_ids: z.array(z.string()).min(1, "Au moins une zone requise"),
  date_debut: z.string().optional().nullable(),
  date_fin: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const createPaiementSchema = z.object({
  patient_id: z.string().min(1, "Patient requis"),
  montant: z.number().positive("Le montant doit etre superieur a 0"),
  type: z.enum(["encaissement", "prise_en_charge", "hors_carte"]),
  mode_paiement: z.enum(["especes", "carte", "virement"]).optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  subscription_id: z.string().optional().nullable(),
  session_id: z.string().optional().nullable(),
});

export const createPreConsultationSchema = z.object({
  patient_id: z.string().min(1, "Patient requis"),
  sexe: z.enum(["M", "F"]),
  age: z.number().int().min(0).max(120),
  phototype: z.string().optional().nullable(),
  statut_marital: z.string().optional().nullable(),
  is_pregnant: z.boolean().optional(),
  is_breastfeeding: z.boolean().optional(),
  pregnancy_planning: z.boolean().optional(),
  has_previous_laser: z.boolean().optional(),
  previous_laser_clarity_ii: z.boolean().optional(),
  previous_laser_sessions: z.number().int().optional().nullable(),
  previous_laser_brand: z.string().optional().nullable(),
  hair_removal_methods: z.array(z.string()).optional(),
  medical_history: z.record(z.boolean()).optional(),
  dermatological_conditions: z.array(z.string()).optional(),
  has_current_treatments: z.boolean().optional(),
  current_treatments_details: z.string().optional().nullable(),
  recent_peeling: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreatePackInput = z.infer<typeof createPackSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type CreatePaiementInput = z.infer<typeof createPaiementSchema>;
export type CreatePreConsultationInput = z.infer<typeof createPreConsultationSchema>;
