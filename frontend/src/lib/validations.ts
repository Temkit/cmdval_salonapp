import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Mot de passe actuel requis"),
    new_password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caracteres"),
    confirm_password: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm_password"],
  });

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "3 caracteres minimum")
    .max(50, "50 caracteres maximum")
    .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et underscores uniquement"),
  password: z.string().min(6, "6 caracteres minimum"),
  nom: z.string().min(1, "Nom requis").max(100),
  prenom: z.string().min(1, "Prenom requis").max(100),
  role_id: z.string().min(1, "Role requis"),
});

export const createPatientSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(100),
  prenom: z.string().min(1, "Prenom requis").max(100),
  date_naissance: z.string().nullable().optional(),
  sexe: z.enum(["M", "F"]).nullable().optional(),
  telephone: z
    .string()
    .regex(/^[0-9+\s()-]*$/, "Format de telephone invalide")
    .nullable()
    .optional(),
  email: z.string().email("Email invalide").nullable().optional().or(z.literal("")),
  adresse: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  phototype: z.string().nullable().optional(),
});

export const createZoneSchema = z.object({
  code: z.string().min(1, "Code requis").max(20),
  nom: z.string().min(1, "Nom requis").max(100),
  description: z.string().max(500).nullable().optional(),
  ordre: z.number().int().min(0).optional(),
  prix: z.number().min(0, "Le prix doit etre positif").nullable().optional(),
  duree_minutes: z.number().int().min(1).nullable().optional(),
  categorie: z.enum(["visage", "bras", "jambes", "corps", "homme"]).nullable().optional(),
  is_homme: z.boolean().optional(),
});

export const createRoleSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(50),
  permissions: z.array(z.string()).min(1, "Au moins une permission requise"),
});

export const createQuestionSchema = z.object({
  texte: z.string().min(1, "Texte requis").max(500),
  type_reponse: z.enum(["boolean", "text", "choice", "multiple"]),
  options: z.array(z.string()).nullable().optional(),
  ordre: z.number().int().min(0).optional(),
  obligatoire: z.boolean().optional(),
});

export const createPackSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(100),
  description: z.string().max(500).nullable().optional(),
  zone_ids: z.array(z.string()).min(1, "Au moins une zone requise"),
  prix: z.number().min(0, "Le prix doit etre positif"),
  duree_jours: z.number().int().min(1).nullable().optional(),
  seances_per_zone: z.number().int().min(1, "Au moins une seance requise"),
});

export const createPromotionSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(100),
  type: z.enum(["pourcentage", "montant"]),
  valeur: z.number().min(0, "La valeur doit etre positive"),
  zone_ids: z.array(z.string()).min(1, "Au moins une zone requise"),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const createPaiementSchema = z.object({
  patient_id: z.string().min(1, "Patient requis"),
  montant: z.number().min(0.01, "Le montant doit etre superieur a 0"),
  type: z.enum(["encaissement", "prise_en_charge", "hors_carte"]),
  mode_paiement: z.string().max(50).nullable().optional(),
  reference: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreatePackInput = z.infer<typeof createPackSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type CreatePaiementInput = z.infer<typeof createPaiementSchema>;
