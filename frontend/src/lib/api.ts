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

  // Questionnaire
  async getPatientQuestionnaire(patientId: string) {
    const response = await fetch(`${API_BASE}/patients/${patientId}/questionnaire`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updatePatientQuestionnaire(patientId: string, responses: any[]) {
    const response = await fetch(`${API_BASE}/patients/${patientId}/questionnaire`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ responses }),
    });
    return handleResponse(response);
  },

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
};

export { ApiError };
