export type ProviderId = 
  | 'tikhub' 
  | 'openai' 
  | 'twocaptcha' 
  | 'anthropic' 
  | 'gemini' 
  | 'groq' 
  | 'deepseek' 
  | 'custom';

export type KeyStatus = 'healthy' | 'warning' | 'danger';

export type Language = 'id' | 'en';

export interface AuthUser {
  username: string;
  displayName: string;
  role: 'admin' | 'user' | 'guest';
  isGuest?: boolean;
  accessToken?: string;
}

export interface KeyDraft {
  projectId: string;
  providerId: ProviderId;
  label: string;
  apiKey: string;
  endpoint?: string;
  alertThreshold: number;
  maxQuota: number;
  notes?: string;
  currency: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface ApiKeyItem {
  id: string;
  projectId: string; // Foreign key linking key to a specific project
  providerId: ProviderId;
  label: string;
  apiKey: string;
  maskedKey: string;
  balance: number;
  maxQuota: number;
  used: number;
  currency: string;
  status: KeyStatus;
  alertThreshold: number;
  lastChecked: string;
  expiry?: string;
  notes?: string;
  endpoint?: string;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  category: string;
  color: string;
  badgeBg: string;
  currency: string;
  keyPrefix: string;
  keyPlaceholder: string;
  defaultThreshold: number;
  topUpUrl: string;
  docsUrl: string;
  endpoint?: string;
  description: string;
}

export interface AppSettings {
  currency: string;
  language: Language;
  soundAlerts: boolean;
  autoRefreshInterval: number;
  defaultThreshold: number;
  defaultView: 'grid' | 'table';
}

export interface SystemStats {
  totalBalance: number;
  activeCount: number;
  warningCount: number;
  dangerCount: number;
  healthyCount: number;
}
