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
  questionnaire_complete: boolean;
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
