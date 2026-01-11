import type { PreConsultation, PatientAlerts, PreConsultationQuestionnaire } from "@/types";

const API_BASE = "/api/v1";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erreur inconnue" }));
    throw new ApiError(response.status, error.detail || "Erreur inconnue");
  }
  return response.json();
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<{ access_token: string; token_type: string }>(response);
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      id: string;
      username: string;
      nom: string;
      prenom: string;
      role_id: string;
      role_nom: string;
      permissions: string[];
    }>(response);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await fetch(`${API_BASE}/auth/password`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    return handleResponse<{ message: string }>(response);
  },

  // Users
  async getUsers() {
    const response = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ users: any[] }>(response);
  },

  async createUser(data: any) {
    const response = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateUser(id: string, data: any) {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteUser(id: string) {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Roles
  async getRoles() {
    const response = await fetch(`${API_BASE}/roles`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ roles: any[] }>(response);
  },

  async createRole(data: any) {
    const response = await fetch(`${API_BASE}/roles`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateRole(id: string, data: any) {
    const response = await fetch(`${API_BASE}/roles/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteRole(id: string) {
    const response = await fetch(`${API_BASE}/roles/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getPermissions() {
    const response = await fetch(`${API_BASE}/roles/permissions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ permissions: any[] }>(response);
  },

  // Patients
  async getPatients(params: { page?: number; size?: number; q?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.size) searchParams.set("size", params.size.toString());
    if (params.q) searchParams.set("q", params.q);

    const response = await fetch(`${API_BASE}/patients?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ patients: any[]; total: number; page: number; size: number; pages: number }>(response);
  },

  async getPatient(id: string) {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getPatientByCard(code: string) {
    const response = await fetch(`${API_BASE}/patients/by-card/${encodeURIComponent(code)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async createPatient(data: any) {
    const response = await fetch(`${API_BASE}/patients`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updatePatient(id: string, data: any) {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deletePatient(id: string) {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Patient zones
  async getPatientZones(patientId: string) {
    const response = await fetch(`${API_BASE}/patients/${patientId}/zones`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ zones: any[] }>(response);
  },

  async addPatientZone(patientId: string, data: any) {
    const response = await fetch(`${API_BASE}/patients/${patientId}/zones`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updatePatientZone(patientId: string, zoneId: string, data: any) {
    const response = await fetch(`${API_BASE}/patients/${patientId}/zones/${zoneId}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deletePatientZone(patientId: string, zoneId: string) {
    const response = await fetch(`${API_BASE}/patients/${patientId}/zones/${zoneId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Pre-consultation Questionnaire
  async getPreConsultationQuestionnaire(preConsultationId: string): Promise<PreConsultationQuestionnaire> {
    const response = await fetch(`${API_BASE}/pre-consultations/${preConsultationId}/questionnaire`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PreConsultationQuestionnaire>(response);
  },

  async updatePreConsultationQuestionnaire(preConsultationId: string, responses: any[]): Promise<PreConsultationQuestionnaire> {
    const response = await fetch(`${API_BASE}/pre-consultations/${preConsultationId}/questionnaire`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ responses }),
    });
    return handleResponse<PreConsultationQuestionnaire>(response);
  },

  // Question Management (Admin)
  async getQuestions() {
    const response = await fetch(`${API_BASE}/questionnaire/questions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ questions: any[] }>(response);
  },

  async createQuestion(data: any) {
    const response = await fetch(`${API_BASE}/questionnaire/questions`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateQuestion(id: string, data: any) {
    const response = await fetch(`${API_BASE}/questionnaire/questions/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteQuestion(id: string) {
    const response = await fetch(`${API_BASE}/questionnaire/questions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async reorderQuestions(data: { question_ids: string[] }) {
    const response = await fetch(`${API_BASE}/questionnaire/questions/order`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Sessions
  async getPatientSessions(patientId: string, params: { page?: number; size?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.size) searchParams.set("size", params.size.toString());

    const response = await fetch(`${API_BASE}/patients/${patientId}/sessions?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ sessions: any[]; total: number; page: number; size: number; pages: number }>(response);
  },

  async createSession(patientId: string, formData: FormData) {
    const response = await fetch(`${API_BASE}/patients/${patientId}/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    return handleResponse(response);
  },

  async getSession(id: string) {
    const response = await fetch(`${API_BASE}/sessions/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getLaserTypes() {
    const response = await fetch(`${API_BASE}/sessions/laser-types`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ types: string[] }>(response);
  },

  // Zones
  async getZones(includeInactive = false) {
    const response = await fetch(`${API_BASE}/zones?include_inactive=${includeInactive}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ zones: any[] }>(response);
  },

  async createZone(data: any) {
    const response = await fetch(`${API_BASE}/zones`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateZone(id: string, data: any) {
    const response = await fetch(`${API_BASE}/zones/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteZone(id: string) {
    const response = await fetch(`${API_BASE}/zones/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Dashboard
  async getDashboardStats() {
    const response = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      total_patients: number;
      total_sessions: number;
      sessions_today: number;
      sessions_month: number;
      questionnaire_completion_rate?: number;
    }>(response);
  },

  async getSessionsByZone() {
    const response = await fetch(`${API_BASE}/dashboard/sessions/by-zone`, {
      headers: getAuthHeaders(),
    });
    const result = await handleResponse<{ zones: any[] }>(response);
    return { data: result.zones || [] };
  },

  async getSessionsByPraticien() {
    const response = await fetch(`${API_BASE}/dashboard/sessions/by-praticien`, {
      headers: getAuthHeaders(),
    });
    const result = await handleResponse<{ praticiens: any[] }>(response);
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
      date_from: dateFrom.toISOString().split("T")[0],
      date_to: now.toISOString().split("T")[0],
      group_by: groupBy,
    });
    const response = await fetch(`${API_BASE}/dashboard/sessions/by-period?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: any[]; group_by: string }>(response);
  },

  async getRecentActivity(limit = 10) {
    const response = await fetch(`${API_BASE}/dashboard/recent-activity?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ activities: any[] }>(response);
  },

  // Pre-consultations
  async getPreConsultations(params: { page?: number; size?: number; status?: string; search?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.size) searchParams.set("size", params.size.toString());
    if (params.status) searchParams.set("status", params.status);
    if (params.search) searchParams.set("search", params.search);

    const response = await fetch(`${API_BASE}/pre-consultations?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      items: any[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>(response);
  },

  async getPreConsultation(id: string): Promise<PreConsultation> {
    const response = await fetch(`${API_BASE}/pre-consultations/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PreConsultation>(response);
  },

  async createPreConsultation(data: any) {
    const response = await fetch(`${API_BASE}/pre-consultations`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updatePreConsultation(id: string, data: any) {
    const response = await fetch(`${API_BASE}/pre-consultations/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deletePreConsultation(id: string) {
    const response = await fetch(`${API_BASE}/pre-consultations/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async addPreConsultationZone(preConsultationId: string, data: any) {
    const response = await fetch(`${API_BASE}/pre-consultations/${preConsultationId}/zones`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updatePreConsultationZone(preConsultationId: string, zoneId: string, data: any) {
    const response = await fetch(`${API_BASE}/pre-consultations/${preConsultationId}/zones/${zoneId}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deletePreConsultationZone(preConsultationId: string, zoneId: string) {
    const response = await fetch(`${API_BASE}/pre-consultations/${preConsultationId}/zones/${zoneId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async submitPreConsultation(id: string) {
    const response = await fetch(`${API_BASE}/pre-consultations/${id}/submit`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async validatePreConsultation(id: string) {
    const response = await fetch(`${API_BASE}/pre-consultations/${id}/validate`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async rejectPreConsultation(id: string, reason: string) {
    const response = await fetch(`${API_BASE}/pre-consultations/${id}/reject`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  async createPatientFromPreConsultation(preConsultationId: string, data: any) {
    const response = await fetch(`${API_BASE}/pre-consultations/${preConsultationId}/create-patient`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getPendingPreConsultationsCount() {
    const response = await fetch(`${API_BASE}/pre-consultations/stats/pending-count`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ count: number }>(response);
  },

  async getPatientPreConsultation(patientId: string): Promise<PreConsultation | null> {
    try {
      const response = await fetch(`${API_BASE}/pre-consultations/by-patient/${patientId}`, {
        headers: getAuthHeaders(),
      });
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
    const response = await fetch(`${API_BASE}/patients/${patientId}/alerts`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      patient_id: string;
      alerts: any[];
      has_alerts: boolean;
      has_errors: boolean;
      has_warnings: boolean;
      error_count: number;
      warning_count: number;
    }>(response);
  },

  async getZoneAlerts(patientId: string, zoneId: string) {
    const response = await fetch(`${API_BASE}/patients/${patientId}/zones/${zoneId}/alerts`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      patient_id: string;
      alerts: any[];
      has_alerts: boolean;
      has_errors: boolean;
      has_warnings: boolean;
      error_count: number;
      warning_count: number;
    }>(response);
  },

  async getAlertsSummary(patientId: string) {
    const response = await fetch(`${API_BASE}/patients/${patientId}/alerts/summary`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      patient_id: string;
      has_alerts: boolean;
      has_errors: boolean;
      error_count: number;
      warning_count: number;
    }>(response);
  },
};

export { ApiError };
