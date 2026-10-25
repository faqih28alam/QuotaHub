'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  RotateCw, 
  Settings, 
  Activity, 
  Database,
  ChevronDown,
  Layers,
  ArrowLeft,
  FolderPlus,
  LogOut,
  User
} from 'lucide-react';
import { Project, Language, AuthUser } from '@/types';
import { TRANSLATIONS } from '@/lib/translations';

interface NavbarProps {
  activeProject: Project | null;
  projects: Project[];
  onSelectProject: (id: string | null) => void;
  onCreateProject: () => void;
  onAddKey: () => void;
  onRefreshAll: () => void;
  onOpenSettings: () => void;
  isRefreshing: boolean;
  isDemoMode: boolean;
  allowDemoToggle?: boolean;
  onToggleDemoMode: (val: boolean) => void;
  language: Language;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export function Navbar({
  activeProject,
  projects,
  onSelectProject,
  onCreateProject,
  onAddKey,
  onRefreshAll,
  onOpenSettings,
  isRefreshing,
  isDemoMode,
  allowDemoToggle = true,
  onToggleDemoMode,
  language,
  currentUser,
  onLogout
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07090e]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Project Selector */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo */}
          <div 
            onClick={() => onSelectProject(null)}
            className="flex items-center gap-2.5 cursor-pointer group"
            title={t.browseAllProjects}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-transform group-hover:scale-105">
              <Activity className="h-5 w-5" />
            </div>
            <div className="hidden xs:block">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white">
                  Quota<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Hub</span>
                </span>
              </div>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-white/15 hidden sm:block" />

          {/* Project Switcher Dropdown */}
          {activeProject ? (
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectProject(null)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                  title={t.browseAllProjects}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{t.projects} /</span>
                </button>

                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  <span 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: activeProject.color || '#06b6d4' }} 
                  />
                  <span className="max-w-[140px] truncate sm:max-w-[200px]">{activeProject.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#0e131f] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t.switchProject}
                  </div>

                  <div className="space-y-0.5 max-h-56 overflow-y-auto">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProject(p.id);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                          activeProject.id === p.id 
                            ? 'bg-cyan-500/15 text-cyan-300 font-semibold' 
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span 
                            className="h-2 w-2 rounded-full shrink-0" 
                            style={{ backgroundColor: p.color || '#06b6d4' }} 
                          />
                          <span className="truncate">{p.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-1 border-t border-white/10 pt-1 space-y-0.5">
                    <button
                      onClick={() => {
                        onSelectProject(null);
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>{t.browseAllProjects}</span>
                    </button>

                    <button
                      onClick={() => {
                        onCreateProject();
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      <span>+ {t.newProject}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>{t.projectHub}</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Demo Mode Toggle (guest / local workspace only) */}
          {allowDemoToggle && <button
            onClick={() => onToggleDemoMode(!isDemoMode)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
              isDemoMode
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
            title="Toggle simulation mode"
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isDemoMode ? t.demoMode : t.liveData}</span>
          </button>}

          {/* Refresh All (only shown when inside a project) */}
          {activeProject && (
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
              title={t.syncAll}
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden md:inline">{t.sync}</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
            title="Pengaturan & Bahasa"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Add Key Button (in project) or New Project (in hub) */}
          {activeProject ? (
            <button
              onClick={onAddKey}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.addKey}</span>
            </button>
          ) : (
            <button
              onClick={onCreateProject}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.newProject}</span>
            </button>
          )}

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
              <div 
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                title={`${t.authLoggedInAs}: ${currentUser.username} (${currentUser.role})`}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                  {currentUser.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="max-w-[85px] truncate font-medium hidden lg:inline">
                  {currentUser.displayName}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="rounded bg-cyan-500/20 px-1 py-0.2 text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
                    Admin
                  </span>
                )}
                {currentUser.isGuest && (
                  <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                    Guest
                  </span>
                )}
              </div>

              <button
                onClick={onLogout}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-white transition-colors"
                title={t.authLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
