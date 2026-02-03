export interface User {
  id: string;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  role_id: string;
  role_nom: string | null;
  actif: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  nom: string;
  description?: string | null;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export type PatientStatus = "en_attente_evaluation" | "actif" | "ineligible";

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
  status: PatientStatus;
  age: number | null;
  created_at: string;
  updated_at: string;
}

export interface PatientDetail extends Patient {
  zones: PatientZone[];
}

export type ZoneCategorie = "visage" | "bras" | "jambes" | "corps" | "homme";

export interface ZoneDefinition {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  ordre: number;
  prix: number | null;
  duree_minutes: number | null;
  categorie: ZoneCategorie | null;
  is_homme: boolean;
  is_active: boolean;
  seances_recommandees?: number;
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
  type_reponse: "boolean" | "text" | "choice" | "multiple" | "number";
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
  reponse: string | boolean | string[] | null;
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
  parametres: Record<string, string | number | null>;
  spot_size: number | null;
  fluence: number | null;
  pulse_duration_ms: number | null;
  frequency_hz: number | null;
  frequence?: string | null;
  tolerance?: string | null;
  effets_immediats?: string | null;
  observations?: string | null;
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
  sessions_month: number;
  new_patients_this_month: number;
  questionnaire_completion_rate?: number;
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
  patient_id: string;
  // Patient info for display
  patient_nom?: string;
  patient_prenom?: string;
  patient_code_carte?: string;
  patient_telephone?: string;
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
  last_hair_removal_date: string | null;
  medical_history: Record<string, boolean>;
  dermatological_conditions: string[];
  has_current_treatments: boolean;
  current_treatments_details: string | null;
  has_moles: boolean;
  moles_location: string | null;
  has_birthmarks: boolean;
  birthmarks_location: string | null;
  contraception_method: string | null;
  hormonal_disease_2years: boolean;
  recent_peeling: boolean;
  recent_peeling_date: string | null;
  peeling_zone: string | null;
  last_laser_date: string | null;
  phototype: string | null;
  notes: string | null;
  status: "draft" | "pending_validation" | "validated" | "rejected";
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
  type?: string;
  severity: "error" | "warning";
  message: string;
  zone_id?: string;
  zone_nom?: string;
  details?: Record<string, unknown>;
}

export interface PatientAlerts {
  patient_id: string;
  has_alerts: boolean;
  has_errors: boolean;
  error_count: number;
  warning_count: number;
  alerts: Alert[];
}

export interface Pack {
  id: string;
  nom: string;
  description: string | null;
  zone_ids: string[];
  prix: number;
  duree_jours: number | null;
  seances_per_zone: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionType = "gold" | "pack" | "seance";

export interface PatientSubscription {
  id: string;
  patient_id: string;
  pack_id: string | null;
  pack_nom: string | null;
  type: SubscriptionType;
  date_debut: string | null;
  date_fin: string | null;
  is_active: boolean;
  montant_paye: number;
  notes: string | null;
  days_remaining: number | null;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}

export type PaiementType = "encaissement" | "prise_en_charge" | "hors_carte";
export type ModePaiement = "especes" | "carte" | "virement";

export interface Paiement {
  id: string;
  patient_id: string;
  patient_nom: string | null;
  patient_prenom: string | null;
  subscription_id: string | null;
  session_id: string | null;
  montant: number;
  type: PaiementType;
  mode_paiement: ModePaiement | null;
  reference: string | null;
  notes: string | null;
  created_by: string | null;
  date_paiement: string;
  created_at: string;
}

export interface RevenueStats {
  total_revenue: number;
  total_payments: number;
  by_type: { type: string; total: number; count: number }[];
}

export type PromotionType = "pourcentage" | "montant";

export interface Promotion {
  id: string;
  nom: string;
  type: PromotionType;
  valeur: number;
  zone_ids: string[];
  date_debut: string | null;
  date_fin: string | null;
  is_active: boolean;
  is_currently_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Box {
  id: string;
  nom: string;
  numero: number;
  is_active: boolean;
  current_user_id?: string | null;
  current_user_name?: string | null;
  created_at: string;
}

export interface BoxAssignment {
  box_id: string;
  box_nom: string;
  user_id: string;
  user_nom: string;
  assigned_at: string;
}

export interface BoxesResponse {
  boxes: Box[];
}

export interface BoxCreateRequest {
  nom: string;
  numero: number;
}

export interface BoxUpdateRequest {
  nom?: string;
  numero?: number;
  is_active?: boolean;
}

export type ScheduleStatus = "expected" | "checked_in" | "in_treatment" | "completed" | "no_show";

export interface DailyScheduleEntry {
  id: string;
  date: string;
  patient_nom: string;
  patient_prenom: string;
  patient_id: string | null;
  doctor_name: string;
  doctor_id: string | null;
  specialite: string | null;
  duration_type: string | null;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  status: ScheduleStatus;
  created_at: string;
}

export type QueueStatus = "waiting" | "in_treatment" | "done";

export interface WaitingQueueEntry {
  id: string;
  schedule_id: string | null;
  patient_id: string | null;
  patient_name: string;
  doctor_id?: string | null;
  doctor_name: string;
  box_id?: string | null;
  box_nom?: string | null;
  checked_in_at: string;
  position: number;
  status: QueueStatus;
  called_at: string | null;
  completed_at: string | null;
}

// Request types
export interface CreateUserRequest {
  username: string;
  password: string;
  nom: string;
  prenom: string;
  role_id: string;
}

export interface UpdateUserRequest {
  nom?: string;
  prenom?: string;
  role_id?: string;
  is_active?: boolean;
}

export interface CreateRoleRequest {
  nom: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  nom?: string;
  permissions?: string[];
}

export interface CreatePatientRequest {
  code_carte?: string;
  nom: string;
  prenom: string;
  date_naissance?: string | null;
  sexe?: "M" | "F" | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  notes?: string | null;
  phototype?: string | null;
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}

export interface CreateZoneRequest {
  code: string;
  nom: string;
  description?: string | null;
  ordre?: number;
  prix?: number | null;
  duree_minutes?: number | null;
  categorie?: ZoneCategorie | null;
  is_homme?: boolean;
}

export interface UpdateZoneRequest extends Partial<CreateZoneRequest> {
  is_active?: boolean;
}

export interface CreateQuestionRequest {
  texte: string;
  type_reponse: "boolean" | "text" | "choice" | "multiple" | "number";
  options?: string[] | null;
  ordre?: number;
  obligatoire?: boolean;
}

export interface UpdateQuestionRequest extends Partial<CreateQuestionRequest> {
  is_active?: boolean;
}

export interface AddPatientZoneRequest {
  zone_definition_id: string;
  seances_prevues: number;
  notes?: string | null;
}

export interface UpdatePatientZoneRequest {
  seances_prevues?: number;
  notes?: string | null;
}

export interface CreatePackRequest {
  nom: string;
  description?: string | null;
  zone_ids: string[];
  prix: number;
  duree_jours?: number | null;
  seances_per_zone: number;
}

export interface UpdatePackRequest extends Partial<CreatePackRequest> {
  is_active?: boolean;
}

export interface CreateSubscriptionRequest {
  type: SubscriptionType;
  pack_id?: string | null;
  montant_paye: number;
  notes?: string | null;
}

export interface CreatePaiementRequest {
  patient_id: string;
  subscription_id?: string | null;
  session_id?: string | null;
  montant: number;
  type: PaiementType;
  mode_paiement?: ModePaiement | null;
  reference?: string | null;
  notes?: string | null;
}

export interface CreatePromotionRequest {
  nom: string;
  type: PromotionType;
  valeur: number;
  zone_ids: string[];
  date_debut?: string | null;
  date_fin?: string | null;
  is_active?: boolean;
}

export interface UpdatePromotionRequest extends Partial<CreatePromotionRequest> {}

export interface AddPreConsultationZoneRequest {
  zone_id: string;
  is_eligible?: boolean;
  observations?: string | null;
}

export interface QuestionnaireResponseInput {
  question_id: string;
  reponse: string | boolean | string[];
}

export interface CreatePatientFromPreConsultationRequest {
  code_carte?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  zone_ids?: string[];
  seances_per_zone?: number;
  notes?: string | null;
}

// Response types
export interface UsersResponse {
  users: User[];
}

export interface RolesResponse {
  roles: Role[];
}

export interface PermissionsResponse {
  permissions: { value: string; label: string }[];
}

export interface PatientsResponse {
  patients: Patient[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ZonesResponse {
  zones: ZoneDefinition[];
}

export interface PatientZonesResponse {
  zones: PatientZone[];
}

export interface QuestionsResponse {
  questions: Question[];
}

export interface PacksResponse {
  packs: Pack[];
}

export interface SubscriptionsResponse {
  subscriptions: PatientSubscription[];
}

export interface PaiementsResponse {
  paiements: Paiement[];
}

export interface PromotionsResponse {
  promotions: Promotion[];
}

export interface PreConsultationsResponse {
  items: PreConsultation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ScheduleResponse {
  entries: DailyScheduleEntry[];
  date: string;
  total: number;
}

export interface QueueResponse {
  entries: WaitingQueueEntry[];
  total: number;
}

export interface AlertsResponse {
  patient_id: string;
  alerts: Alert[];
  has_alerts: boolean;
  has_errors: boolean;
  has_warnings?: boolean;
  error_count: number;
  warning_count: number;
}

export interface ZonePriceResponse {
  zone_id: string;
  original_price: number;
  final_price: number;
  promotions: { id: string; nom: string; type: PromotionType; valeur: number }[];
}

export interface PeriodDataItem {
  period: string;
  count: number;
}

export interface ZoneStatsItem {
  zone_id: string;
  zone_nom: string;
  count: number;
}

export interface PraticienStatsItem {
  praticien_id: string;
  praticien_nom: string;
  count: number;
}

export interface ActivityItem {
  type: string;
  description: string;
  date: string;
  timestamp?: string;
  patient_nom?: string;
}

export interface SideEffectStatsResponse {
  total: number;
  by_severity: { severity: string; count: number }[];
  trend: { month: string; count: number }[];
}

export interface DoctorPerformanceItem {
  doctor_id: string;
  doctor_name: string;
  avg_duration_minutes: number;
  total_sessions: number;
  comparison_to_avg: number;
  expected_avg_duration: number;
  status: string;
}

export interface DoctorPerformanceResponse {
  doctors: DoctorPerformanceItem[];
  overall_avg_duration: number;
}

export interface RevenueBreakdown {
  total_revenue: number;
  revenue_by_type: { type: string; total: number; count: number }[];
  revenue_by_period: { period: string; total: number }[];
  hors_carte_revenue: number;
  hors_carte_count: number;
  pack_revenue: number;
  pack_count: number;
}

export interface DemographicsResponse {
  age_distribution: { range: string; count: number }[];
  city_distribution: { city: string; count: number }[];
}

export interface MessageResponse {
  message: string;
}
