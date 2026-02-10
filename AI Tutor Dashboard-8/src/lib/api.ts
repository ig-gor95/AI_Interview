/**
 * API client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Save auth token to localStorage
function saveAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

// Remove auth token
function removeAuthToken(): void {
  localStorage.removeItem('auth_token');
}

// Make API request with authentication
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear auth data and redirect to login
      removeAuthToken();
      localStorage.removeItem('currentUser');
      // Reload page to trigger redirect to login
      window.location.href = '/';
      throw new Error('Session expired. Please log in again.');
    }

    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  async register(email: string, name: string, password: string, role: 'organizer' | 'student') {
    const data = await apiRequest<{ id: string; email: string; name: string; role: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, name, password, role }),
      }
    );
    return data;
  },

  async login(email: string, password: string) {
    const data = await apiRequest<{ access_token: string; token_type: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    
    // Save token
    if (data.access_token) {
      saveAuthToken(data.access_token);
    }
    
    return data;
  },

  async getCurrentUser() {
    return apiRequest<{ id: string; email: string; name: string; role: string }>(
      '/auth/me'
    );
  },

  logout() {
    removeAuthToken();
  },
};

// Interviews API (interview templates)
export const interviewsAPI = {
  async getInterviews() {
    return apiRequest<any[]>('/interviews');
  },

  async getInterview(id: string) {
    return apiRequest<any>(`/interviews/${id}`);
  },

  async createInterview(interviewData: { params: any }) {
    return apiRequest<any>('/interviews', {
      method: 'POST',
      body: JSON.stringify(interviewData),
    });
  },

  async updateInterview(interviewId: string, interviewData: { params: any }) {
    return apiRequest<any>(`/interviews/${interviewId}`, {
      method: 'PUT',
      body: JSON.stringify(interviewData),
    });
  },

  async createLink(interviewId: string) {
    return apiRequest<{
      id: string;
      interviewId: string;
      token: string;
      isUsed: boolean;
      expiresAt: string | null;
      createdAt: string;
      url: string;
    }>(`/interviews/${interviewId}/links`, {
      method: 'POST',
    });
  },

  async getLinks(interviewId: string) {
    return apiRequest<{
      id: string;
      interviewId: string;
      token: string;
      isUsed: boolean;
      expiresAt: string | null;
      sessionId: string | null;
      createdAt: string;
      url: string;
    }[]>(`/interviews/${interviewId}/links`);
  },

  async deleteInterview(interviewId: string) {
    return apiRequest<void>(`/interviews/${interviewId}`, {
      method: 'DELETE',
    });
  },

  async deleteLink(interviewId: string, linkId: string) {
    return apiRequest<void>(`/interviews/${interviewId}/links/${linkId}`, {
      method: 'DELETE',
    });
  },

  async generateInterviewContent(jobDescription: string, position?: string) {
    return apiRequest<{
      success: boolean;
      data: {
        questions: Array<{
          text: string;
          clarifications?: string[];
        }>;
        mustHaveRequirements: string[];
        niceToHaveRequirements: string[];
        simulation: {
          role: string;
          scenario: string;
        };
      };
    }>('/interviews/generate', {
      method: 'POST',
      body: JSON.stringify({ job_description: jobDescription, position }),
    });
  },

  async generateCriteria(position: string, company?: string) {
    return apiRequest<{
      success: boolean;
      data: {
        mustHaveRequirements: string[];
        niceToHaveRequirements: string[];
      };
    }>('/interviews/generate-criteria', {
      method: 'POST',
      body: JSON.stringify({ position, company }),
    });
  },
};

// Sessions API (concrete interview sessions) - kept for backward compatibility
export const sessionsAPI = interviewsAPI;

// Results API
export const resultsAPI = {
  async getResults() {
    return apiRequest<any[]>('/results');
  },

  async getResult(id: string) {
    return apiRequest<any>(`/results/${id}`);
  },

  async getStatistics() {
    return apiRequest<{
      totalInterviews: number;
      completedCandidates: number;
      recommendedPercentage: number;
    }>('/results/statistics');
  },

  async getCandidates(params?: {
    interview_id?: string;
    status?: 'recommended' | 'questionable' | 'not-recommended';
    min_rating?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.interview_id) queryParams.append('interview_id', params.interview_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.min_rating !== undefined) queryParams.append('min_rating', params.min_rating.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/results/candidates${queryString ? `?${queryString}` : ''}`;
    return apiRequest<{
      results: any[];
      total: number;
    }>(endpoint);
  },

  async getCandidateDetail(sessionId: string) {
    return apiRequest<{
      result: any;
      evaluation: any;
      interview?: { position?: string; company?: string; questions?: string[] };
      simulation?: {
        scenarioDescription?: string;
        clientRole?: string;
        dialog?: Array<{ role?: string; message?: string; tone?: string }>;
        observations?: Array<{ category?: string; text?: string }>;
      };
    }>(`/results/candidates/${sessionId}`);
  },

  async getCandidateTranscript(sessionId: string, offset: number = 0, limit: number = 50) {
    return apiRequest<{
      messages: Array<{
        role: string;
        message: string;
        timestamp?: string;
        audioUrl?: string;
        orderIndex?: number;
      }>;
      total: number;
      offset: number;
      limit: number;
      hasMore: boolean;
    }>(`/results/candidates/${sessionId}/transcript?offset=${offset}&limit=${limit}`);
  },
};

// Public API (no authentication required)
async function publicApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const publicAPI = {
  async getInterviewByToken(token: string) {
    return publicApiRequest<{
      id: string;
      position: string;
      company: string | null;
      params: any;
    }>(`/interview/${token}`);
  },

  async registerCandidate(token: string, data: {
    firstName: string;
    lastName: string;
    email?: string;
  }) {
    return publicApiRequest<{
      id: string;
      interviewId: string;
      candidateName: string;
      candidateSurname: string | null;
      candidateEmail: string | null;
      status: string;
      createdAt: string;
    }>(`/interview/${token}/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async startSession(token: string) {
    return publicApiRequest<{
      sessionId: string;
      status: string;
      startedAt: string | null;
      isResume: boolean;
      transcript: Array<{
        role: string;
        message: string;
        timestamp: string;
        audioUrl?: string;
      }>;
      duration: number; // в минутах
      remainingSeconds: number; // оставшееся время в секундах
    }>(`/interview/${token}/start`, {
      method: 'POST',
    });
  },
};

