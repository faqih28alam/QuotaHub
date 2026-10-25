'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { LoginPortal } from '@/components/LoginPortal';
import { ProjectPicker } from '@/components/ProjectPicker';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { AlertBanner } from '@/components/AlertBanner';
import { MetricCards } from '@/components/MetricCards';
import { FilterBar } from '@/components/FilterBar';
import { ProviderCard } from '@/components/ProviderCard';
import { ProviderTable } from '@/components/ProviderTable';
import { AddKeyModal } from '@/components/AddKeyModal';
import { SettingsModal } from '@/components/SettingsModal';
import { Toast } from '@/components/Toast';
import { ApiKeyItem, Project, SystemStats, Language, AuthUser, KeyDraft } from '@/types';
import { ClientStorage } from '@/lib/storage';
import { ApiError, QuotaApi } from '@/lib/api';
import { maskKey } from '@/lib/utils';
import { PROVIDERS } from '@/lib/providers';
import { TRANSLATIONS } from '@/lib/translations';
import { Shield, KeyRound, Sparkles, ArrowLeft, Plus } from 'lucide-react';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [language, setLanguage] = useState<Language>('id'); // Default Indonesia
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isServerSession, setIsServerSession] = useState(false);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const applyLocalWorkspace = useCallback(() => {
    setIsServerSession(false);
    setIsDemoMode(ClientStorage.isDemoMode());
    setProjects(ClientStorage.getProjects());
    setKeys(ClientStorage.getKeys());
    setActiveProjectId(ClientStorage.getActiveProjectId());
  }, []);

  const loadServerWorkspace = useCallback(async () => {
    const [serverProjects, serverKeys] = await Promise.all([
      QuotaApi.listProjects(),
      QuotaApi.listKeys(),
    ]);
    setIsServerSession(true);
    setIsDemoMode(false);
    setProjects(serverProjects);
    setKeys(serverKeys);
    const savedProject = ClientStorage.getActiveProjectId();
    setActiveProjectId(serverProjects.some((p) => p.id === savedProject) ? savedProject : null);
  }, []);

  // Initialize data and check authentication on client mount
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const lang = ClientStorage.getLanguage();
      if (!cancelled) setLanguage(lang);
      const auth = ClientStorage.getAuthUser();

      if (auth?.accessToken && !auth.isGuest) {
        try {
          await loadServerWorkspace();
          if (cancelled) return;
          setCurrentUser(auth);
        } catch {
          ClientStorage.setAuthUser(null);
          if (cancelled) return;
          setCurrentUser(null);
          applyLocalWorkspace();
        }
      } else {
        if (cancelled) return;
        setCurrentUser(auth);
        applyLocalWorkspace();
      }

      if (!cancelled) setIsAuthLoaded(true);
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [applyLocalWorkspace, loadServerWorkspace]);

  const t = TRANSLATIONS[language];

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Authentication Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.accessToken && !user.isGuest) {
      setIsServerSession(true);
      setIsDemoMode(false);
      setProjects([]);
      setKeys([]);
      void loadServerWorkspace().catch((err: unknown) => {
        ClientStorage.setAuthUser(null);
        setCurrentUser(null);
        setIsServerSession(false);
        applyLocalWorkspace();
        const message = err instanceof Error ? err.message : 'Failed to load workspace';
        showToast(message);
      });
    } else {
      applyLocalWorkspace();
    }
    showToast(language === 'id' ? `Selamat datang, ${user.displayName}!` : `Welcome, ${user.displayName}!`);
  };

  const handleLogout = () => {
    ClientStorage.setAuthUser(null);
    setCurrentUser(null);
    setIsServerSession(false);
    applyLocalWorkspace();
    showToast(language === 'id' ? 'Berhasil keluar' : 'Logged out successfully');
  };

  // Language switch handler
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    ClientStorage.setLanguage(newLang);
    showToast(newLang === 'id' ? 'Bahasa diubah ke Indonesia' : 'Language switched to English');
  };

  // Active Project object
  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  // Project Selection handler
  const handleSelectProject = (id: string | null) => {
    setActiveProjectId(id);
    ClientStorage.setActiveProjectId(id);
    setSearchQuery('');
    setSelectedProvider('all');
    setSelectedStatus('all');
  };

  // Create Project
  const handleCreateProject = async (newProject: Project) => {
    if (isServerSession) {
      try {
        const created = await QuotaApi.createProject(newProject);
        const updated = await QuotaApi.listProjects();
        setProjects(updated);
        handleSelectProject(created.id);
        showToast(language === 'id' ? `Project "${created.name}" berhasil dibuat!` : `Project "${created.name}" created!`);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to create project');
        throw err;
      }
      return;
    }

    ClientStorage.addProject(newProject);
    const updated = ClientStorage.getProjects();
    setProjects(updated);
    setIsDemoMode(false);
    handleSelectProject(newProject.id);
    showToast(language === 'id' ? `Project "${newProject.name}" berhasil dibuat!` : `Project "${newProject.name}" created!`);
  };

  // Delete Project
  const handleDeleteProject = async (id: string) => {
    if (isServerSession) {
      try {
        await QuotaApi.deleteProject(id);
        setProjects(await QuotaApi.listProjects());
        setKeys(await QuotaApi.listKeys());
        if (activeProjectId === id) handleSelectProject(null);
        showToast(language === 'id' ? 'Project berhasil dihapus' : 'Project deleted');
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to delete project');
      }
      return;
    }

    ClientStorage.deleteProject(id);
    setProjects(ClientStorage.getProjects());
    setKeys(ClientStorage.getKeys());
    if (activeProjectId === id) {
      handleSelectProject(null);
    }
    showToast(language === 'id' ? 'Project berhasil dihapus' : 'Project deleted');
  };

  // Toggle Demo Mode
  const handleToggleDemoMode = (enabled: boolean) => {
    ClientStorage.setDemoMode(enabled);
    setIsDemoMode(enabled);
    const updatedProjects = ClientStorage.getProjects();
    const updatedKeys = ClientStorage.getKeys();
    setProjects(updatedProjects);
    setKeys(updatedKeys);
    if (activeProjectId && !updatedProjects.some(p => p.id === activeProjectId)) {
      handleSelectProject(null);
    }
    showToast(enabled 
      ? (language === 'id' ? 'Beralih ke Mode Demo' : 'Switched to Demo Simulation Mode')
      : (language === 'id' ? 'Beralih ke Data Asli' : 'Switched to Live Data')
    );
  };

  // Add Key
  const handleAddKey = async (draft: KeyDraft) => {
    if (isServerSession) {
      try {
        const created = await QuotaApi.createKey(draft);
        setKeys((prev) => [created, ...prev.filter((k) => k.id !== created.id)]);
        setProjects(await QuotaApi.listProjects());
        showToast(language === 'id'
          ? `"${created.label}" berhasil ditambahkan ke ${activeProject?.name || 'Project'}!`
          : `Added "${created.label}" to ${activeProject?.name || 'Project'}!`
        );
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to save key');
        throw err;
      }
      return;
    }

    const provider = PROVIDERS[draft.providerId];
    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: draft.projectId,
      providerId: draft.providerId,
      label: draft.label.trim() || `${provider.name} Key`,
      apiKey: draft.apiKey.trim(),
      maskedKey: maskKey(draft.apiKey.trim()),
      balance: 10,
      maxQuota: draft.maxQuota,
      used: 0,
      currency: draft.currency,
      status: 'healthy',
      alertThreshold: draft.alertThreshold,
      lastChecked: new Date().toISOString(),
      notes: draft.notes,
      endpoint: draft.endpoint,
    };
    ClientStorage.addKey(newKey);
    setKeys(ClientStorage.getKeys());
    setIsDemoMode(false);
    showToast(language === 'id'
      ? `"${newKey.label}" berhasil ditambahkan ke ${activeProject?.name || 'Project'}!`
      : `Added "${newKey.label}" to ${activeProject?.name || 'Project'}!`
    );
  };

  // Delete Key
  const handleDeleteKey = async (id: string) => {
    if (isServerSession) {
      try {
        await QuotaApi.deleteKey(id);
        setKeys((prev) => prev.filter((k) => k.id !== id));
        setProjects(await QuotaApi.listProjects());
        showToast(language === 'id' ? 'API key berhasil dihapus' : 'API key removed');
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to delete key');
      }
      return;
    }

    const updated = ClientStorage.deleteKey(id);
    setKeys(updated);
    showToast(language === 'id' ? 'API key berhasil dihapus' : 'API key removed');
  };

  // Refresh single key
  const handleRefreshKey = async (keyItem: ApiKeyItem) => {
    if (isServerSession) {
      try {
        const synced = await QuotaApi.syncKey(keyItem.id);
        setKeys((prev) => prev.map((k) => (k.id === synced.id ? synced : k)));
        showToast(language === 'id' ? `Saldo ${keyItem.label} diperbarui` : `Synced balance for ${keyItem.label}`);
      } catch (err: unknown) {
        const message = err instanceof ApiError ? err.message : 'Sync failed';
        showToast(language === 'id' ? `Info: ${message}` : `Sync note: ${message}`);
      }
      return;
    }

    try {
      const res = await fetch('/api/check-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: keyItem.id,
          providerId: keyItem.providerId,
          apiKey: keyItem.apiKey,
          balance: keyItem.balance,
          alertThreshold: keyItem.alertThreshold,
          maxQuota: keyItem.maxQuota,
          endpoint: keyItem.endpoint
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updated = ClientStorage.updateKey(keyItem.id, {
          balance: data.balance,
          used: data.used,
          status: data.status,
          lastChecked: data.lastChecked
        });
        setKeys([...updated]);
        showToast(language === 'id' ? `Saldo ${keyItem.label} diperbarui` : `Synced balance for ${keyItem.label}`);
      } else {
        showToast(language === 'id' ? `Info: ${data.error || 'Menggunakan saldo cache'}` : `Sync note: ${data.error || 'Cached balance retained'}`);
      }
    } catch {
      showToast(language === 'id' ? 'Koneksi gagal, saldo cache tetap digunakan' : 'Network request failed, cached quota retained');
    }
  };

  // Refresh all keys in active project
  const handleRefreshAll = async () => {
    const targetKeys = activeProjectId 
      ? keys.filter(k => k.projectId === activeProjectId)
      : keys;
    if (targetKeys.length === 0) return;
    setIsRefreshing(true);
    try {
      for (const k of targetKeys) {
        await handleRefreshKey(k);
      }
      showToast(language === 'id' ? 'Semua saldo project berhasil disinkronkan!' : 'Project balances synced successfully!');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter keys scoped to active project
  const projectKeys = useMemo(() => {
    if (!activeProjectId) return [];
    return keys.filter(k => k.projectId === activeProjectId);
  }, [keys, activeProjectId]);

  const filteredKeys = useMemo(() => {
    return projectKeys.filter((k) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = k.label.toLowerCase().includes(q);
        const matchProvider = k.providerId.toLowerCase().includes(q);
        const matchNotes = k.notes?.toLowerCase().includes(q);
        if (!matchLabel && !matchProvider && !matchNotes) return false;
      }
      if (selectedProvider !== 'all' && k.providerId !== selectedProvider) {
        return false;
      }
      if (selectedStatus !== 'all' && k.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [projectKeys, searchQuery, selectedProvider, selectedStatus]);

  // Aggregate stats for active project
  const stats: SystemStats = useMemo(() => {
    let total = 0;
    let healthy = 0;
    let warning = 0;
    let danger = 0;

    for (const k of projectKeys) {
      total += k.balance;
      if (k.status === 'healthy') healthy++;
      else if (k.status === 'warning') warning++;
      else if (k.status === 'danger') danger++;
    }

    return {
      totalBalance: total,
      activeCount: projectKeys.length,
      healthyCount: healthy,
      warningCount: warning,
      dangerCount: danger
    };
  }, [projectKeys]);

  const criticalKeys = useMemo(() => {
    return projectKeys.filter((k) => k.status === 'danger' || k.status === 'warning');
  }, [projectKeys]);

  // Prevent flash before local auth state resolves
  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-cyan-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  // 1. IF NOT LOGGED IN: SHOW LOGIN PORTAL
  if (!currentUser) {
    return (
      <LoginPortal
        onLoginSuccess={handleLoginSuccess}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  // 2. IF LOGGED IN: SHOW MAIN QUOTAHUB DASHBOARD
  return (
    <div className="relative min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* Background ambient gradient glow */}
      <div className="fixed top-[-10%] left-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      {/* Navbar with Project Switcher & User Profile */}
      <Navbar
        activeProject={activeProject}
        projects={projects}
        onSelectProject={handleSelectProject}
        onCreateProject={() => setIsCreateProjectModalOpen(true)}
        onAddKey={() => setIsAddKeyModalOpen(true)}
        onRefreshAll={handleRefreshAll}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isRefreshing={isRefreshing}
        isDemoMode={isDemoMode}
        allowDemoToggle={!isServerSession}
        onToggleDemoMode={handleToggleDemoMode}
        language={language}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Low Quota Alert Banner (if in project) */}
      {activeProject && <AlertBanner criticalKeys={criticalKeys} language={language} />}

      {/* Main App Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 space-y-6">
        {/* VIEW 1: PROJECT PICKER SCREEN (User has not selected a project yet) */}
        {!activeProject ? (
          <ProjectPicker
            projects={projects}
            allKeys={keys}
            onSelectProject={handleSelectProject}
            onCreateProject={() => setIsCreateProjectModalOpen(true)}
            onDeleteProject={handleDeleteProject}
            language={language}
          />
        ) : (
          /* VIEW 2: ACTIVE PROJECT DASHBOARD (User picked a project) */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Project Header Banner */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSelectProject(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                  title={t.browseAllProjects}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="h-2.5 w-2.5 rounded-full" 
                      style={{ backgroundColor: activeProject.color || '#06b6d4' }} 
                    />
                    <h1 className="text-xl font-extrabold tracking-tight text-white">
                      {activeProject.name}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeProject.description || (language === 'id' ? 'Pemantauan kuota dan saldo API key untuk project ini.' : 'Monitored API credentials and runway balances for this project.')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddKeyModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.addKey}</span>
                </button>
              </div>
            </div>

            {/* Metric Cards for this Project */}
            <MetricCards stats={stats} language={language} />

            {/* Filter & Search Toolbar */}
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedProvider={selectedProvider}
              onSelectProvider={setSelectedProvider}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              language={language}
            />

            {/* Project API Keys Display */}
            {filteredKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0e131f]/40 p-12 text-center backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-slate-500 mb-3">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {projectKeys.length === 0 
                    ? `${t.noKeysInProject}` 
                    : t.noKeysMatchFilter}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  {projectKeys.length === 0
                    ? t.addKeyToProjectPrompt
                    : t.resetFilterPrompt}
                </p>
                <button
                  onClick={() => setIsAddKeyModalOpen(true)}
                  className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all"
                >
                  + {t.addKeyToProjectBtn} {activeProject.name}
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredKeys.map((keyItem) => (
                  <ProviderCard
                    key={keyItem.id}
                    keyItem={keyItem}
                    onRefresh={handleRefreshKey}
                    onDelete={handleDeleteKey}
                    onCopyNotice={showToast}
                    language={language}
                  />
                ))}
              </div>
            ) : (
              <ProviderTable
                keys={filteredKeys}
                onRefresh={handleRefreshKey}
                onDelete={handleDeleteKey}
                onCopyNotice={showToast}
                language={language}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-[#07090e]/90 py-5 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>{t.privacyGuarantee}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>QuotaHub Dashboard</span>
            <span>•</span>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-white transition-colors"
            >
              {t.exportBackup}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSave={handleCreateProject}
        language={language}
      />

      <AddKeyModal
        isOpen={isAddKeyModalOpen}
        onClose={() => setIsAddKeyModalOpen(false)}
        onSave={handleAddKey}
        activeProject={activeProject}
        projects={projects}
        language={language}
        useServer={isServerSession}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        keys={keys}
        projects={projects}
        useServer={isServerSession}
        onWorkspaceReload={async () => {
          const auth = ClientStorage.getAuthUser();
          if (auth?.accessToken && !auth.isGuest) {
            setCurrentUser(auth);
            await loadServerWorkspace();
          } else {
            setCurrentUser(auth);
            applyLocalWorkspace();
          }
        }}
        onNotice={showToast}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      {/* Floating Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
