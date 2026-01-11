export interface User {
  id: string;
  username: string;
  nom: string;
  prenom: string;
  role_id: string;
  role_nom: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  nom: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  code_carte: string;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  sexe: "M" | "F" | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  notes: string | null;
  phototype: string | null;
  age: number | null;
  created_at: string;
  updated_at: string;
}

export interface PatientDetail extends Patient {
  zones: PatientZone[];
}

export interface ZoneDefinition {
  id: string;
  nom: string;
  description: string | null;
  ordre: number;
  is_active: boolean;
  created_at: string;
}

export interface PatientZone {
  id: string;
  patient_id: string;
  zone_definition_id: string;
  zone_nom: string;
  seances_prevues: number;
  seances_effectuees: number;
  seances_restantes: number;
  progression: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  texte: string;
  type_reponse: "boolean" | "text" | "choice" | "multiple";
  options: string[] | null;
  ordre: number;
  obligatoire: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionResponse {
  id: string;
  question_id: string;
  question_texte: string;
  question_type: string;
  reponse: any;
  created_at: string;
  updated_at: string;
}

export interface SessionPhoto {
  id: string;
  filename: string;
  url: string;
  created_at: string;
}

export interface Session {
  id: string;
  patient_id: string;
  patient_zone_id: string;
  zone_nom: string;
  praticien_id: string;
  praticien_nom: string;
  date_seance: string;
  type_laser: string;
  parametres: Record<string, any>;
  notes: string | null;
  duree_minutes: number | null;
  photos: SessionPhoto[];
  created_at: string;
}

export interface SessionDetail extends Session {
  patient_nom: string;
  patient_prenom: string;
  patient_code_carte: string;
}

export interface DashboardStats {
  total_patients: number;
  total_sessions: number;
  sessions_today: number;
  sessions_this_month: number;
  new_patients_this_month: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PreConsultationZone {
  id: string;
  pre_consultation_id: string;
  zone_id: string;
  zone_nom?: string;
  is_eligible: boolean;
  observations: string | null;
  created_at: string;
}

export interface PreConsultation {
  id: string;
  patient_id: string | null;
  sexe: "M" | "F";
  age: number;
  statut_marital: string | null;
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  pregnancy_planning: boolean;
  has_previous_laser: boolean;
  previous_laser_clarity_ii: boolean;
  previous_laser_sessions: number | null;
  previous_laser_brand: string | null;
  hair_removal_methods: string[];
  medical_history: Record<string, boolean>;
  dermatological_conditions: string[];
  has_current_treatments: boolean;
  current_treatments_details: string | null;
  recent_peeling: boolean;
  recent_peeling_date: string | null;
  phototype: string | null;
  notes: string | null;
  status: "draft" | "pending_validation" | "validated" | "rejected" | "patient_created";
  rejection_reason: string | null;
  created_by: string | null;
  created_by_name: string | null;
  validated_by: string | null;
  validated_by_name: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  zones: PreConsultationZone[];
  zones_count?: number;
  has_contraindications: boolean;
}

export interface PreConsultationQuestionnaire {
  pre_consultation_id: string;
  responses: QuestionResponse[];
  total_questions: number;
  answered_questions: number;
  is_complete: boolean;
}

export interface Alert {
  severity: "error" | "warning";
  message: string;
  zone_id?: string;
  zone_nom?: string;
}

export interface PatientAlerts {
  patient_id: string;
  has_alerts: boolean;
  has_errors: boolean;
  error_count: number;
  warning_count: number;
  alerts: Alert[];
}
