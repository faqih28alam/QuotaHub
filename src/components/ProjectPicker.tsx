'use client';

import React from 'react';
import { 
  FolderPlus, 
  ChevronRight, 
  Layers, 
  Trash2, 
  Bot,
  Sparkles,
  TrendingUp,
  Boxes
} from 'lucide-react';
import { Project, ApiKeyItem, Language } from '@/types';
import { PROVIDERS } from '@/lib/providers';
import { TRANSLATIONS } from '@/lib/translations';

interface ProjectPickerProps {
  projects: Project[];
  allKeys: ApiKeyItem[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  language: Language;
}

export function ProjectPicker({
  projects,
  allKeys,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  language
}: ProjectPickerProps) {
  const t = TRANSLATIONS[language];

  // Helper to get icon component
  const getProjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bot': return <Bot className="h-5 w-5" />;
      case 'Sparkles': return <Sparkles className="h-5 w-5" />;
      case 'TrendingUp': return <TrendingUp className="h-5 w-5" />;
      default: return <Boxes className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-cyan-400" />
            <span>{t.selectProjectTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.selectProjectDesc}
          </p>
        </div>

        <button
          onClick={onCreateProject}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95"
        >
          <FolderPlus className="h-4 w-4" />
          <span>{t.newProjectBtn}</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((proj) => {
          const projKeys = allKeys.filter((k) => k.projectId === proj.id);
          const totalBalance = projKeys.reduce((acc, k) => acc + k.balance, 0);
          const hasWarning = projKeys.some((k) => k.status === 'warning');
          const hasDanger = projKeys.some((k) => k.status === 'danger');

          // Unique providers in this project
          const uniqueProviders = Array.from(new Set(projKeys.map((k) => k.providerId)));

          return (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-[#0e131f]/75 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.15)] cursor-pointer"
            >
              {/* Color Top Border Accent */}
              <div 
                className="absolute top-0 left-0 right-0 h-[2px] transition-all"
                style={{ background: `linear-gradient(90deg, transparent, ${proj.color || '#06b6d4'}, transparent)` }}
              />

              <div>
                {/* Project Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white shadow-inner"
                      style={{ backgroundColor: `${proj.color || '#06b6d4'}20`, color: proj.color || '#06b6d4' }}
                    >
                      {getProjectIcon(proj.icon)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {proj.name}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {projKeys.length} {projKeys.length === 1 ? t.apiKeySingular : t.apiKeyPlural}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {hasDanger ? (
                      <span className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                        {t.statusDepleted}
                      </span>
                    ) : hasWarning ? (
                      <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        {t.statusLowQuota}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {t.statusHealthy}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                  {proj.description || '-'}
                </p>

                {/* Project Balance */}
                <div className="mt-4 rounded-lg border border-white/5 bg-black/40 p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="uppercase tracking-wider font-semibold">{t.totalBalance}</span>
                    <span className="font-mono text-emerald-400 font-semibold">${totalBalance.toFixed(2)}</span>
                  </div>

                  {/* Provider Icons / Badges */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {uniqueProviders.length === 0 ? (
                      <span className="text-[11px] text-slate-500">{t.noKeysYet}</span>
                    ) : (
                      uniqueProviders.map((provId) => {
                        const prov = PROVIDERS[provId];
                        if (!prov) return null;
                        return (
                          <span
                            key={provId}
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold border ${prov.badgeBg}`}
                          >
                            {prov.name}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <span className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>{t.openMonitoring}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t.deleteProjectConfirm)) {
                      onDeleteProject(proj.id);
                    }
                  }}
                  className="rounded p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                  title="Hapus Project"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Create Project Dashed Card */}
        <div
          onClick={onCreateProject}
          className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:bg-white/[0.04] hover:shadow-lg"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
            <FolderPlus className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">{t.createProjectCardTitle}</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {t.createProjectCardDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
