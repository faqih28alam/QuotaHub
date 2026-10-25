import { ApiKeyItem, AppSettings, Project, Language, AuthUser } from '@/types';
import { INITIAL_DEMO_KEYS, INITIAL_DEMO_PROJECTS } from './demo-data';

const KEYS_STORAGE_KEY = 'quotahub_user_keys_v2';
const PROJECTS_STORAGE_KEY = 'quotahub_projects_v2';
const ACTIVE_PROJECT_KEY = 'quotahub_active_project_id_v2';
const SETTINGS_STORAGE_KEY = 'quotahub_user_settings_v2';
const DEMO_MODE_KEY = 'quotahub_is_demo_v2';
const LANGUAGE_STORAGE_KEY = 'quotahub_language_v2';
const AUTH_USER_KEY = 'quotahub_auth_user_v2';
const REGISTERED_USERS_KEY = 'quotahub_registered_users_v2';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  language: 'id', // Default to Indonesia as requested
  soundAlerts: false,
  autoRefreshInterval: 300,
  defaultThreshold: 2.0,
  defaultView: 'grid'
};

export const ClientStorage = {
  // Authentication & Session
  getAuthUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setAuthUser(user: AuthUser | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  },

  getRegisteredUsers(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  },

  registerUser(username: string, pass: string): boolean {
    const users = this.getRegisteredUsers();
    users[username.toLowerCase()] = pass;
    if (typeof window !== 'undefined') {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    }
    return true;
  },

  isDemoMode(): boolean {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem(DEMO_MODE_KEY);
    if (val === null) {
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      return true;
    }
    return val === 'true';
  },

  setDemoMode(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEMO_MODE_KEY, String(enabled));
  },

  // Language Preference (Default 'id')
  getLanguage(): Language {
    if (typeof window === 'undefined') return 'id';
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (saved === 'en' || saved === 'id') return saved;
    return 'id'; // default Indonesia
  },

  setLanguage(lang: Language): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    const settings = this.getSettings();
    settings.language = lang;
    this.saveSettings(settings);
  },

  // Active Selected Project
  getActiveProjectId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  },

  setActiveProjectId(id: string | null): void {
    if (typeof window === 'undefined') return;
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  },

  // Projects CRUD
  getProjects(): Project[] {
    if (typeof window === 'undefined') return INITIAL_DEMO_PROJECTS;
    if (this.isDemoMode()) {
      return INITIAL_DEMO_PROJECTS;
    }
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveProjects(projects: Project[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  },

  addProject(project: Project): void {
    const projects = this.isDemoMode() ? [] : this.getProjects();
    this.setDemoMode(false);
    projects.push(project);
    this.saveProjects(projects);
  },

  deleteProject(id: string): void {
    let projects = this.getProjects();
    projects = projects.filter(p => p.id !== id);
    if (!this.isDemoMode()) {
      this.saveProjects(projects);
      let keys = this.getKeys();
      keys = keys.filter(k => k.projectId !== id);
      this.saveKeys(keys);
    }
    if (this.getActiveProjectId() === id) {
      this.setActiveProjectId(null);
    }
  },

  // Keys CRUD
  getKeys(): ApiKeyItem[] {
    if (typeof window === 'undefined') return INITIAL_DEMO_KEYS;
    if (this.isDemoMode()) {
      return INITIAL_DEMO_KEYS;
    }
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveKeys(keys: ApiKeyItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  },

  addKey(key: ApiKeyItem): void {
    const keys = this.isDemoMode() ? [] : this.getKeys();
    this.setDemoMode(false);
    keys.unshift(key);
    this.saveKeys(keys);
  },

  updateKey(id: string, updates: Partial<ApiKeyItem>): ApiKeyItem[] {
    let keys = this.getKeys();
    keys = keys.map(k => (k.id === id ? { ...k, ...updates } : k));
    if (!this.isDemoMode()) {
      this.saveKeys(keys);
    }
    return keys;
  },

  deleteKey(id: string): ApiKeyItem[] {
    let keys = this.getKeys();
    keys = keys.filter(k => k.id !== id);
    if (!this.isDemoMode()) {
      this.saveKeys(keys);
    }
    return keys;
  },

  // Settings
  getSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  },

  exportJSON(keys: ApiKeyItem[]): string {
    const backup = {
      app: 'QuotaHub',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      language: this.getLanguage(),
      projects: this.isDemoMode() ? INITIAL_DEMO_PROJECTS : this.getProjects(),
      keys,
      settings: this.getSettings()
    };
    return JSON.stringify(backup, null, 2);
  },

  importJSON(jsonString: string): { success: boolean; count?: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.keys)) {
        this.setDemoMode(false);
        this.saveKeys(parsed.keys);
        if (Array.isArray(parsed.projects)) {
          this.saveProjects(parsed.projects);
        }
        if (parsed.language) {
          this.setLanguage(parsed.language);
        }
        if (parsed.settings) {
          this.saveSettings(parsed.settings);
        }
        return { success: true, count: parsed.keys.length };
      }
      return { success: false, error: 'Missing keys array in JSON file.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON file';
      return { success: false, error: msg };
    }
  },

  resetAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS_STORAGE_KEY);
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this.setDemoMode(true);
  }
};
