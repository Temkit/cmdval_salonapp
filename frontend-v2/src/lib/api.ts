import type {
  PreConsultation,
  PreConsultationQuestionnaire,
  User,
  Role,
  Patient,
  PatientDetail,
  PatientZone,
  ZoneDefinition,
  Question,
  Session,
  SessionDetail,
  DashboardStats,
  Pack,
  PatientSubscription,
  Paiement,
  Promotion,
  DailyScheduleEntry,
  WaitingQueueEntry,
  RevenueStats,
  Box,
  BoxAssignment,
  BoxesResponse,
  BoxCreateRequest,
  BoxUpdateRequest,
  CreateUserRequest,
  UpdateUserRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePatientRequest,
  UpdatePatientRequest,
  CreateZoneRequest,
  UpdateZoneRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  AddPatientZoneRequest,
  UpdatePatientZoneRequest,
  CreatePackRequest,
  UpdatePackRequest,
  CreateSubscriptionRequest,
  CreatePaiementRequest,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  AddPreConsultationZoneRequest,
  QuestionnaireResponseInput,
  CreatePatientFromPreConsultationRequest,
  ManualScheduleEntryRequest,
  UsersResponse,
  RolesResponse,
  PermissionsResponse,
  PatientsResponse,
  SessionsResponse,
  ZonesResponse,
  PatientZonesResponse,
  QuestionsResponse,
  PacksResponse,
  SubscriptionsResponse,
  PaiementsResponse,
  PromotionsResponse,
  PreConsultationsResponse,
  ScheduleResponse,
  QueueResponse,
  AlertsResponse,
  ZonePriceResponse,
  PeriodDataItem,
  ZoneStatsItem,
  PraticienStatsItem,
  ActivityItem,
  SideEffectStatsResponse,
  DoctorPerformanceResponse,
  RevenueBreakdown,
  DemographicsResponse,
  MessageResponse,
} from "@/types";

const API_BASE = "/api/v1";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Erreur inconnue" }));
    throw new ApiError(response.status, error.detail || "Erreur inconnue");
  }
  return response.json();
}

function wrapFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const mergedInit: RequestInit = {
    ...init,
    credentials: "include",
  };
  return fetch(input, mergedInit).catch((err) => {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new ApiError(0, "Verifiez votre connexion internet");
    }
    throw err;
  });
}

export const api = {
  // Auth
  async login(username: string, password: string) {
    const response = await wrapFetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<{ access_token: string; token_type: string }>(
      response,
    );
  },

  async logout() {
    const response = await wrapFetch(`${API_BASE}/auth/logout`, {
      method: "POST",
    });
    return handleResponse<MessageResponse>(response);
  },

  async getCurrentUser() {
    const response = await wrapFetch(`${API_BASE}/auth/me`);
    return handleResponse<{
      id: string;
      username: string;
      nom: string;
      prenom: string;
      role_id: string;
      role_nom: string;
      permissions: string[];
      box_id: string | null;
      box_nom: string | null;
    }>(response);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await wrapFetch(`${API_BASE}/auth/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    return handleResponse<MessageResponse>(response);
  },

  // Users
  async getUsers() {
    const response = await wrapFetch(`${API_BASE}/users`);
    return handleResponse<UsersResponse>(response);
  },

  async createUser(data: CreateUserRequest) {
    const response = await wrapFetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  async updateUser(id: string, data: UpdateUserRequest) {
    const response = await wrapFetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  async deleteUser(id: string) {
    const response = await wrapFetch(`${API_BASE}/users/${id}`, {
      method: "DELETE",
    });
    return handleResponse<MessageResponse>(response);
  },

  // Roles
  async getRoles() {
    const response = await wrapFetch(`${API_BASE}/roles`);
    return handleResponse<RolesResponse>(response);
  },

  async createRole(data: CreateRoleRequest) {
    const response = await wrapFetch(`${API_BASE}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Role>(response);
  },

  async updateRole(id: string, data: UpdateRoleRequest) {
    const response = await wrapFetch(`${API_BASE}/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Role>(response);
  },

  async deleteRole(id: string) {
    const response = await wrapFetch(`${API_BASE}/roles/${id}`, {
      method: "DELETE",
    });
    return handleResponse<MessageResponse>(response);
  },

  async getPermissions() {
    const response = await wrapFetch(`${API_BASE}/roles/permissions`);
    return handleResponse<PermissionsResponse>(response);
  },

  // Patients
  async getPatients(
    params: { page?: number; size?: number; q?: string } = {},
  ) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.size) searchParams.set("size", params.size.toString());
    if (params.q) searchParams.set("q", params.q);

    const response = await wrapFetch(
      `${API_BASE}/patients?${searchParams}`,
    );
    return handleResponse<PatientsResponse>(response);
  },

  async getPatient(id: string) {
    const response = await wrapFetch(`${API_BASE}/patients/${id}`);
    return handleResponse<PatientDetail>(response);
  },

  async getPatientByCard(code: string) {
    const response = await wrapFetch(
      `${API_BASE}/patients/by-card/${encodeURIComponent(code)}`,
    );
    return handleResponse<PatientDetail>(response);
  },

  async createPatient(data: CreatePatientRequest) {
    const response = await wrapFetch(`${API_BASE}/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Patient>(response);
  },

  async updatePatient(id: string, data: UpdatePatientRequest) {
    const response = await wrapFetch(`${API_BASE}/patients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Patient>(response);
  },

  async deletePatient(id: string) {
    const response = await wrapFetch(`${API_BASE}/patients/${id}`, {
      method: "DELETE",
    });
    return handleResponse<MessageResponse>(response);
  },

  // Patient zones
  async getPatientZones(patientId: string) {
    const response = await wrapFetch(
      `${API_BASE}/patients/${patientId}/zones`,
    );
    return handleResponse<PatientZonesResponse>(response);
  },

  async addPatientZone(patientId: string, data: AddPatientZoneRequest) {
    const response = await wrapFetch(
      `${API_BASE}/patients/${patientId}/zones`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<PatientZone>(response);
  },

  async updatePatientZone(
    patientId: string,
    zoneId: string,
    data: UpdatePatientZoneRequest,
  ) {
    const response = await wrapFetch(
      `${API_BASE}/patients/${patientId}/zones/${zoneId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<PatientZone>(response);
  },

  async deletePatientZone(patientId: string, zoneId: string) {
    const response = await wrapFetch(
      `${API_BASE}/patients/${patientId}/zones/${zoneId}`,
      { method: "DELETE" },
    );
    return handleResponse<MessageResponse>(response);
  },

  // Pre-consultation Questionnaire
  async getPreConsultationQuestionnaire(
    preConsultationId: string,
  ): Promise<PreConsultationQuestionnaire> {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${preConsultationId}/questionnaire`,
    );
    return handleResponse<PreConsultationQuestionnaire>(response);
  },

  async updatePreConsultationQuestionnaire(
    preConsultationId: string,
    responses: QuestionnaireResponseInput[],
  ): Promise<PreConsultationQuestionnaire> {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${preConsultationId}/questionnaire`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      },
    );
    return handleResponse<PreConsultationQuestionnaire>(response);
  },

  // Question Management (Admin)
  async getQuestions() {
    const response = await wrapFetch(
      `${API_BASE}/questionnaire/questions`,
    );
    return handleResponse<QuestionsResponse>(response);
  },

  async createQuestion(data: CreateQuestionRequest) {
    const response = await wrapFetch(
      `${API_BASE}/questionnaire/questions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<Question>(response);
  },

  async updateQuestion(id: string, data: UpdateQuestionRequest) {
    const response = await wrapFetch(
      `${API_BASE}/questionnaire/questions/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<Question>(response);
  },

  async deleteQuestion(id: string) {
    const response = await wrapFetch(
      `${API_BASE}/questionnaire/questions/${id}`,
      { method: "DELETE" },
    );
    return handleResponse<MessageResponse>(response);
  },

  async reorderQuestions(data: { question_ids: string[] }) {
    const response = await wrapFetch(
      `${API_BASE}/questionnaire/questions/order`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<MessageResponse>(response);
  },

  // Sessions
  async getPatientSessions(
    patientId: string,
    params: { page?: number; size?: number } = {},
  ) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.size) searchParams.set("size", params.size.toString());

    const response = await wrapFetch(
      `${API_BASE}/patients/${patientId}/sessions?${searchParams}`,
    );
    return handleResponse<SessionsResponse>(response);
  },

  async createSession(patientId: string, formData: FormData) {
    const response = await wrapFetch(
      `${API_BASE}/patients/${patientId}/sessions`,
      { method: "POST", body: formData },
    );
    return handleResponse<Session>(response);
  },

  async getSession(id: string) {
    const response = await wrapFetch(`${API_BASE}/sessions/${id}`);
    return handleResponse<SessionDetail>(response);
  },

  async getLastSessionParams(patientId: string, patientZoneId: string) {
    const params = new URLSearchParams({
      patient_id: patientId,
      patient_zone_id: patientZoneId,
    });
    const response = await wrapFetch(
      `${API_BASE}/sessions/last-params?${params}`,
    );
    return handleResponse<{
      type_laser: string;
      spot_size: string | null;
      fluence: string | null;
      pulse_duration_ms: string | null;
      frequency_hz: string | null;
      session_date: string | null;
    }>(response);
  },

  async getLaserTypes() {
    const response = await wrapFetch(`${API_BASE}/sessions/laser-types`);
    return handleResponse<{ types: string[] }>(response);
  },

  // Zones
  async getZones(includeInactive = false) {
    const response = await wrapFetch(
      `${API_BASE}/zones?include_inactive=${includeInactive}`,
    );
    return handleResponse<ZonesResponse>(response);
  },

  async createZone(data: CreateZoneRequest) {
    const response = await wrapFetch(`${API_BASE}/zones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<ZoneDefinition>(response);
  },

  async updateZone(id: string, data: UpdateZoneRequest) {
    const response = await wrapFetch(`${API_BASE}/zones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<ZoneDefinition>(response);
  },

  async deleteZone(id: string) {
    const response = await wrapFetch(`${API_BASE}/zones/${id}`, {
      method: "DELETE",
    });
    return handleResponse<MessageResponse>(response);
  },

  // Dashboard
  async getDashboardStats() {
    const response = await wrapFetch(`${API_BASE}/dashboard/stats`);
    return handleResponse<DashboardStats>(response);
  },

  async getSessionsByZone() {
    const response = await wrapFetch(
      `${API_BASE}/dashboard/sessions/by-zone`,
    );
    const result = await handleResponse<{ zones: ZoneStatsItem[] }>(
      response,
    );
    return { data: result.zones || [] };
  },

  async getSessionsByPraticien() {
    const response = await wrapFetch(
      `${API_BASE}/dashboard/sessions/by-praticien`,
    );
    const result = await handleResponse<{
      praticiens: PraticienStatsItem[];
    }>(response);
    return { data: result.praticiens || [] };
  },

  async getSessionsByPeriod(period: string) {
    const now = new Date();
    let dateFrom: Date;
    let groupBy: string;

    switch (period) {
      case "week":
        dateFrom = new Date(now);
        dateFrom.setDate(now.getDate() - 7);
        groupBy = "day";
        break;
      case "month":
        dateFrom = new Date(now);
        dateFrom.setMonth(now.getMonth() - 1);
        groupBy = "day";
        break;
      case "quarter":
        dateFrom = new Date(now);
        dateFrom.setMonth(now.getMonth() - 3);
        groupBy = "week";
        break;
      case "year":
        dateFrom = new Date(now);
        dateFrom.setFullYear(now.getFullYear() - 1);
        groupBy = "month";
        break;
      default:
        dateFrom = new Date(now);
        dateFrom.setMonth(now.getMonth() - 1);
        groupBy = "day";
    }

    const searchParams = new URLSearchParams({
      date_from: dateFrom.toISOString().split("T")[0]!,
      date_to: now.toISOString().split("T")[0]!,
      group_by: groupBy,
    });
    const response = await wrapFetch(
      `${API_BASE}/dashboard/sessions/by-period?${searchParams}`,
    );
    return handleResponse<{ data: PeriodDataItem[]; group_by: string }>(
      response,
    );
  },

  async getRecentActivity(limit = 10) {
    const response = await wrapFetch(
      `${API_BASE}/dashboard/recent-activity?limit=${limit}`,
    );
    return handleResponse<{ activities: ActivityItem[] }>(response);
  },

  // Pre-consultations
  async getPreConsultations(
    params: {
      page?: number;
      size?: number;
      status?: string;
      search?: string;
    } = {},
  ) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.size) searchParams.set("size", params.size.toString());
    if (params.status) searchParams.set("status", params.status);
    if (params.search) searchParams.set("search", params.search);

    const response = await wrapFetch(
      `${API_BASE}/pre-consultations?${searchParams}`,
    );
    return handleResponse<PreConsultationsResponse>(response);
  },

  async getPreConsultation(id: string): Promise<PreConsultation> {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${id}`,
    );
    return handleResponse<PreConsultation>(response);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createPreConsultation(data: any) {
    const response = await wrapFetch(`${API_BASE}/pre-consultations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<PreConsultation>(response);
  },

  async updatePreConsultation(id: string, data: Record<string, unknown>) {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<PreConsultation>(response);
  },

  async deletePreConsultation(id: string) {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${id}`,
      { method: "DELETE" },
    );
    return handleResponse<MessageResponse>(response);
  },

  async addPreConsultationZone(
    preConsultationId: string,
    data: AddPreConsultationZoneRequest,
  ) {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${preConsultationId}/zones`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<PreConsultation>(response);
  },

  async updatePreConsultationZone(
    preConsultationId: string,
    zoneId: string,
    data: Partial<AddPreConsultationZoneRequest>,
  ) {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${preConsultationId}/zones/${zoneId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<PreConsultation>(response);
  },

  async deletePreConsultationZone(
    preConsultationId: string,
    zoneId: string,
  ) {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${preConsultationId}/zones/${zoneId}`,
      { method: "DELETE" },
    );
    return handleResponse<MessageResponse>(response);
  },

  async submitPreConsultation(id: string) {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${id}/submit`,
      { method: "POST" },
    );
    return handleResponse<PreConsultation>(response);
  },

  async validatePreConsultation(id: string) {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${id}/validate`,
      { method: "POST" },
    );
    return handleResponse<PreConsultation>(response);
  },

  async rejectPreConsultation(id: string, reason: string) {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${id}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      },
    );
    return handleResponse<PreConsultation>(response);
  },

  async createPatientFromPreConsultation(
    preConsultationId: string,
    data: CreatePatientFromPreConsultationRequest,
  ) {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/${preConsultationId}/create-patient`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<Patient>(response);
  },

  async getPendingPreConsultationsCount() {
    const response = await wrapFetch(
      `${API_BASE}/pre-consultations/stats/pending-count`,
    );
    return handleResponse<{ count: number }>(response);
  },

  async getPatientPreConsultation(
    patientId: string,
  ): Promise<PreConsultation | null> {
    try {
      const response = await wrapFetch(
        `${API_BASE}/pre-consultations/by-patient/${patientId}`,
      );
      if (response.status === 404) {
        return null;
      }
      return handleResponse<PreConsultation>(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Alerts
  async getPatientAlerts(patientId: string) {
    const response = await wrapFetch(
      `${API_BASE}/patients/${patientId}/alerts`,
    );
    return handleResponse<AlertsResponse>(response);
  },

  async getZoneAlerts(patientId: string, zoneId: string) {
    const response = await wrapFetch(
      `${API_BASE}/patients/${patientId}/zones/${zoneId}/alerts`,
    );
    return handleResponse<AlertsResponse>(response);
  },

  async getAlertsSummary(patientId: string) {
    const response = await wrapFetch(
      `${API_BASE}/patients/${patientId}/alerts/summary`,
    );
    return handleResponse<AlertsResponse>(response);
  },

  // Packs
  async getPacks(includeInactive = false) {
    const response = await wrapFetch(
      `${API_BASE}/packs?include_inactive=${includeInactive}`,
    );
    return handleResponse<PacksResponse>(response);
  },

  async createPack(data: CreatePackRequest) {
    const response = await wrapFetch(`${API_BASE}/packs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Pack>(response);
  },

  async updatePack(id: string, data: UpdatePackRequest) {
    const response = await wrapFetch(`${API_BASE}/packs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Pack>(response);
  },

  async deletePack(id: string) {
    const response = await wrapFetch(`${API_BASE}/packs/${id}`, {
      method: "DELETE",
    });
    return handleResponse<MessageResponse>(response);
  },

  // Subscriptions
  async createSubscription(
    patientId: string,
    data: CreateSubscriptionRequest,
  ) {
    const response = await wrapFetch(
      `${API_BASE}/packs/patients/${patientId}/subscriptions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<PatientSubscription>(response);
  },

  async getPatientSubscriptions(patientId: string) {
    const response = await wrapFetch(
      `${API_BASE}/packs/patients/${patientId}/subscriptions`,
    );
    return handleResponse<SubscriptionsResponse>(response);
  },

  // Paiements
  async createPaiement(data: CreatePaiementRequest) {
    const response = await wrapFetch(`${API_BASE}/paiements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Paiement>(response);
  },

  async getPaiements(
    params: {
      patient_id?: string;
      date_from?: string;
      date_to?: string;
      type?: string;
    } = {},
  ) {
    const searchParams = new URLSearchParams();
    if (params.patient_id)
      searchParams.set("patient_id", params.patient_id);
    if (params.date_from) searchParams.set("date_from", params.date_from);
    if (params.date_to) searchParams.set("date_to", params.date_to);
    if (params.type) searchParams.set("type", params.type);
    const response = await wrapFetch(
      `${API_BASE}/paiements?${searchParams}`,
    );
    return handleResponse<PaiementsResponse>(response);
  },

  async getPatientPaiements(patientId: string) {
    const response = await wrapFetch(
      `${API_BASE}/paiements/patients/${patientId}`,
    );
    return handleResponse<PaiementsResponse>(response);
  },

  async getRevenueStats() {
    const response = await wrapFetch(`${API_BASE}/paiements/stats`);
    return handleResponse<RevenueStats>(response);
  },

  // Promotions
  async getPromotions(includeInactive = false) {
    const response = await wrapFetch(
      `${API_BASE}/promotions?include_inactive=${includeInactive}`,
    );
    return handleResponse<PromotionsResponse>(response);
  },

  async getActivePromotions() {
    const response = await wrapFetch(`${API_BASE}/promotions/active`);
    return handleResponse<PromotionsResponse>(response);
  },

  async createPromotion(data: CreatePromotionRequest) {
    const response = await wrapFetch(`${API_BASE}/promotions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Promotion>(response);
  },

  async updatePromotion(id: string, data: UpdatePromotionRequest) {
    const response = await wrapFetch(`${API_BASE}/promotions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Promotion>(response);
  },

  async deletePromotion(id: string) {
    const response = await wrapFetch(`${API_BASE}/promotions/${id}`, {
      method: "DELETE",
    });
    return handleResponse<MessageResponse>(response);
  },

  async getZonePrice(zoneId: string, originalPrice: number) {
    const response = await wrapFetch(
      `${API_BASE}/promotions/zones/${zoneId}/price?original_price=${originalPrice}`,
    );
    return handleResponse<ZonePriceResponse>(response);
  },

  // Schedule
  async createManualScheduleEntry(data: ManualScheduleEntryRequest) {
    const response = await wrapFetch(`${API_BASE}/schedule/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<DailyScheduleEntry>(response);
  },

  async reassignPatient(entryId: string, doctorId: string) {
    const response = await wrapFetch(
      `${API_BASE}/schedule/queue/${entryId}/reassign?doctor_id=${doctorId}`,
      { method: "PUT" },
    );
    return handleResponse<WaitingQueueEntry>(response);
  },

  async uploadSchedule(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await wrapFetch(`${API_BASE}/schedule/upload`, {
      method: "POST",
      body: formData,
    });
    return handleResponse<{
      message: string;
      entries_created: number;
      date: string;
    }>(response);
  },

  async getTodaySchedule() {
    const response = await wrapFetch(`${API_BASE}/schedule/today`);
    return handleResponse<ScheduleResponse>(response);
  },

  async getSchedule(date: string) {
    const response = await wrapFetch(`${API_BASE}/schedule/${date}`);
    return handleResponse<ScheduleResponse>(response);
  },

  async checkInPatient(entryId: string) {
    const response = await wrapFetch(
      `${API_BASE}/schedule/${entryId}/check-in`,
      { method: "POST" },
    );
    return handleResponse<WaitingQueueEntry>(response);
  },

  // Queue
  async getQueue(doctorId?: string) {
    const params = doctorId ? `?doctor_id=${doctorId}` : "";
    const response = await wrapFetch(
      `${API_BASE}/schedule/queue${params}`,
    );
    return handleResponse<QueueResponse>(response);
  },

  async getDisplayQueue() {
    const response = await wrapFetch(
      `${API_BASE}/schedule/queue/display`,
    );
    return handleResponse<{ entries: WaitingQueueEntry[] }>(response);
  },

  async callPatient(entryId: string) {
    const response = await wrapFetch(
      `${API_BASE}/schedule/queue/${entryId}/call`,
      { method: "PUT" },
    );
    return handleResponse<WaitingQueueEntry>(response);
  },

  async completePatient(entryId: string) {
    const response = await wrapFetch(
      `${API_BASE}/schedule/queue/${entryId}/complete`,
      { method: "PUT" },
    );
    return handleResponse<WaitingQueueEntry>(response);
  },

  async markNoShow(entryId: string) {
    const response = await wrapFetch(
      `${API_BASE}/schedule/queue/${entryId}/no-show`,
      { method: "PUT" },
    );
    return handleResponse<WaitingQueueEntry>(response);
  },

  async markLeft(entryId: string) {
    const response = await wrapFetch(
      `${API_BASE}/schedule/queue/${entryId}/left`,
      { method: "PUT" },
    );
    return handleResponse<WaitingQueueEntry>(response);
  },

  // Temp Photos
  async uploadTempPhoto(blob: Blob): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append("photo", blob, "photo.jpg");
    const response = await wrapFetch(
      `${API_BASE}/documents/temp-photo`,
      { method: "POST", body: formData },
    );
    return handleResponse<{ id: string; url: string }>(response);
  },

  async deleteTempPhoto(id: string): Promise<void> {
    await wrapFetch(`${API_BASE}/documents/temp-photo/${id}`, {
      method: "DELETE",
    });
  },

  // Documents & QR
  getPatientConsentUrl(patientId: string) {
    return `${API_BASE}/documents/patients/${patientId}/documents/consent`;
  },

  getPatientRulesUrl(patientId: string) {
    return `${API_BASE}/documents/patients/${patientId}/documents/rules`;
  },

  getPatientPrecautionsUrl(patientId: string) {
    return `${API_BASE}/documents/patients/${patientId}/documents/precautions`;
  },

  getPatientQRCodeUrl(patientId: string) {
    return `${API_BASE}/documents/patients/${patientId}/qr-code`;
  },

  // Dashboard enhancements
  async getSideEffectStats() {
    const response = await wrapFetch(
      `${API_BASE}/dashboard/side-effects`,
    );
    return handleResponse<SideEffectStatsResponse>(response);
  },

  async getDoctorPerformance() {
    const response = await wrapFetch(
      `${API_BASE}/dashboard/doctor-performance`,
    );
    return handleResponse<DoctorPerformanceResponse>(response);
  },

  async getDashboardRevenue(
    params: { date_from?: string; date_to?: string } = {},
  ) {
    const searchParams = new URLSearchParams();
    if (params.date_from) searchParams.set("date_from", params.date_from);
    if (params.date_to) searchParams.set("date_to", params.date_to);
    const response = await wrapFetch(
      `${API_BASE}/dashboard/revenue?${searchParams}`,
    );
    return handleResponse<RevenueBreakdown>(response);
  },

  async getDemographics() {
    const response = await wrapFetch(
      `${API_BASE}/dashboard/demographics`,
    );
    return handleResponse<DemographicsResponse>(response);
  },

  // Boxes
  async getBoxes() {
    const response = await wrapFetch(`${API_BASE}/boxes`);
    return handleResponse<BoxesResponse>(response);
  },

  async createBox(data: BoxCreateRequest) {
    const response = await wrapFetch(`${API_BASE}/boxes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Box>(response);
  },

  async updateBox(id: string, data: BoxUpdateRequest) {
    const response = await wrapFetch(`${API_BASE}/boxes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Box>(response);
  },

  async deleteBox(id: string) {
    const response = await wrapFetch(`${API_BASE}/boxes/${id}`, {
      method: "DELETE",
    });
    return handleResponse<MessageResponse>(response);
  },

  async assignBox(boxId: string) {
    const response = await wrapFetch(`${API_BASE}/boxes/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ box_id: boxId }),
    });
    return handleResponse<BoxAssignment>(response);
  },

  async unassignBox() {
    const response = await wrapFetch(`${API_BASE}/boxes/assign`, {
      method: "DELETE",
    });
    return handleResponse<MessageResponse>(response);
  },

  async getMyBox() {
    const response = await wrapFetch(`${API_BASE}/boxes/my`);
    return handleResponse<BoxAssignment | null>(response);
  },

  async getLostTimeStats(
    params: { date_from?: string; date_to?: string } = {},
  ) {
    const searchParams = new URLSearchParams();
    if (params.date_from) searchParams.set("date_from", params.date_from);
    if (params.date_to) searchParams.set("date_to", params.date_to);
    const response = await wrapFetch(
      `${API_BASE}/dashboard/lost-time?${searchParams}`,
    );
    return handleResponse<{
      by_doctor: Array<{
        doctor_id: string;
        doctor_name: string;
        total_expected_minutes: number;
        total_actual_minutes: number;
        lost_minutes: number;
        session_count: number;
      }>;
      by_laser: Array<{
        type_laser: string;
        total_expected_minutes: number;
        total_actual_minutes: number;
        lost_minutes: number;
        session_count: number;
      }>;
    }>(response);
  },
};

export { ApiError };
