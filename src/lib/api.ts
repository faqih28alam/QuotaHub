import { ApiKeyItem, AuthUser, KeyDraft, KeyStatus, MonitorRoute, Project, ProviderId, ServiceMonitor } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const AUTH_USER_KEY = 'quotahub_auth_user_v2';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return parsed.accessToken || null;
  } catch {
    return null;
  }
}

interface ServerProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: string;
}

interface ServerKey {
  id: string;
  projectId: string;
  providerId: string;
  label: string;
  maskedKey: string;
  balance: number;
  maxQuota: number;
  used: number;
  currency: string;
  status: string;
  alertThreshold: number;
  lastChecked: string;
  notes?: string;
  endpoint?: string;
}

function toProject(row: ServerProject): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    color: row.color,
    icon: row.icon,
    createdAt: row.createdAt,
  };
}

function toKey(row: ServerKey): ApiKeyItem {
  return {
    id: row.id,
    projectId: row.projectId,
    providerId: (row.providerId || 'custom') as ProviderId,
    label: row.label,
    apiKey: '',
    maskedKey: row.maskedKey,
    balance: row.balance,
    maxQuota: row.maxQuota,
    used: row.used,
    currency: row.currency || '$',
    status: (row.status || 'healthy') as KeyStatus,
    alertThreshold: row.alertThreshold,
    lastChecked: row.lastChecked,
    notes: row.notes,
    endpoint: row.endpoint,
  };
}

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers, cache: 'no-store' });
  } catch {
    throw new ApiError('API server is unreachable', 0);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data as { detail?: unknown }).detail;
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => (typeof item === 'object' && item && 'msg' in item ? String(item.msg) : '')).filter(Boolean).join(', ')
        : `Request failed (${res.status})`;
    throw new ApiError(message || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

interface AuthPayload {
  accessToken: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user' | 'guest';
  isGuest: boolean;
}

function toSession(payload: AuthPayload): AuthUser {
  return {
    username: payload.username,
    displayName: payload.displayName,
    role: payload.role,
    isGuest: payload.isGuest,
    accessToken: payload.accessToken,
  };
}

export const QuotaApi = {
  authConfig(): Promise<{ allowSignup: boolean }> {
    return request<{ allowSignup: boolean }>('/auth/config', { method: 'GET' }, false);
  },

  login(username: string, password: string): Promise<AuthUser> {
    return request<AuthPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, false).then(toSession);
  },

  register(username: string, password: string, email?: string): Promise<AuthUser> {
    return request<AuthPayload>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email: email || null }),
    }, false).then(toSession);
  },

  async listProjects(): Promise<Project[]> {
    const rows = await request<ServerProject[]>('/projects/');
    return rows.map(toProject);
  },

  async createProject(project: Pick<Project, 'name' | 'description' | 'color' | 'icon'>): Promise<Project> {
    const row = await request<ServerProject>('/projects/', {
      method: 'POST',
      body: JSON.stringify({
        name: project.name,
        description: project.description,
        color: project.color,
        icon: project.icon,
      }),
    });
    return toProject(row);
  },

  deleteProject(id: string): Promise<void> {
    return request<void>(`/projects/${id}`, { method: 'DELETE' });
  },

  async listKeys(): Promise<ApiKeyItem[]> {
    const rows = await request<ServerKey[]>('/keys/');
    return rows.map(toKey);
  },

  async createKey(draft: KeyDraft): Promise<ApiKeyItem> {
    const row = await request<ServerKey>('/keys/', {
      method: 'POST',
      body: JSON.stringify({
        project_id: draft.projectId,
        provider: draft.providerId,
        label: draft.label,
        raw_api_key: draft.apiKey,
        alert_threshold: draft.alertThreshold,
        max_quota: draft.maxQuota,
        notes: draft.notes || '',
        endpoint: draft.endpoint || null,
        currency: draft.currency,
      }),
    });
    return toKey(row);
  },

  async syncKey(id: string): Promise<ApiKeyItem> {
    const row = await request<ServerKey>(`/keys/${id}/sync`, { method: 'POST' });
    return toKey(row);
  },

  deleteKey(id: string): Promise<void> {
    return request<void>(`/keys/${id}`, { method: 'DELETE' });
  },

  listMonitors(projectId: string): Promise<ServiceMonitor[]> {
    return request<ServiceMonitor[]>(`/monitors/?project_id=${encodeURIComponent(projectId)}`);
  },

  createMonitor(input: { projectId: string; name: string; url: string; route: MonitorRoute }): Promise<ServiceMonitor> {
    return request<ServiceMonitor>('/monitors/', {
      method: 'POST',
      body: JSON.stringify({
        project_id: input.projectId,
        name: input.name,
        url: input.url,
        route: input.route,
      }),
    });
  },

  checkMonitor(id: string): Promise<ServiceMonitor> {
    return request<ServiceMonitor>(`/monitors/${id}/check`, { method: 'POST' });
  },

  deleteMonitor(id: string): Promise<void> {
    return request<void>(`/monitors/${id}`, { method: 'DELETE' });
  },

  testKey(draft: Pick<KeyDraft, 'providerId' | 'apiKey' | 'endpoint' | 'alertThreshold' | 'maxQuota'>): Promise<{
    success: boolean;
    balance: number;
    status: string;
  }> {
    return request('/keys/test', {
      method: 'POST',
      body: JSON.stringify({
        provider: draft.providerId,
        raw_api_key: draft.apiKey,
        endpoint: draft.endpoint || null,
        alert_threshold: draft.alertThreshold,
        max_quota: draft.maxQuota,
      }),
    });
  },
};
