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

  async deleteLink(interviewId: string, linkId: string) {
    return apiRequest<void>(`/interviews/${interviewId}/links/${linkId}`, {
      method: 'DELETE',
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

