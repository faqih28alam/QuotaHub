'use client';

import React, { useRef } from 'react';
import { X, Settings, Download, Upload, Trash2, ShieldCheck, Globe } from 'lucide-react';
import { ApiKeyItem, Language, Project } from '@/types';
import { ClientStorage } from '@/lib/storage';
import { QuotaApi } from '@/lib/api';
import { TRANSLATIONS } from '@/lib/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: ApiKeyItem[];
  projects?: Project[];
  useServer?: boolean;
  onWorkspaceReload?: () => void | Promise<void>;
  onNotice: (msg: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  keys,
  projects = [],
  useServer = false,
  onWorkspaceReload,
  onNotice,
  language,
  onLanguageChange
}: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = useServer
      ? JSON.stringify({
          app: 'QuotaHub',
          version: '2.0.0',
          exportedAt: new Date().toISOString(),
          projects,
          keys: keys.map((key) => ({ ...key, apiKey: '' })),
          note: 'Secrets stay encrypted on the server and are not included in this export.',
        }, null, 2)
      : ClientStorage.exportJSON(keys);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotahub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotice(language === 'id' ? 'Berhasil mengekspor cadangan JSON' : 'Exported backup successfully');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (useServer) {
        try {
          const parsed = JSON.parse(content) as {
            projects?: Project[];
            keys?: ApiKeyItem[];
          };
          const idMap = new Map<string, string>();
          for (const project of parsed.projects || []) {
            const created = await QuotaApi.createProject(project);
            idMap.set(project.id, created.id);
          }
          let imported = 0;
          let skipped = 0;
          for (const key of parsed.keys || []) {
            const projectId = idMap.get(key.projectId);
            if (!projectId || !key.apiKey) {
              skipped += 1;
              continue;
            }
            await QuotaApi.createKey({
              projectId,
              providerId: key.providerId,
              label: key.label,
              apiKey: key.apiKey,
              endpoint: key.endpoint,
              alertThreshold: key.alertThreshold,
              maxQuota: key.maxQuota,
              notes: key.notes,
              currency: key.currency,
            });
            imported += 1;
          }
          await onWorkspaceReload?.();
          onNotice(language === 'id'
            ? `Berhasil mengimpor ${imported} key${skipped ? `, ${skipped} dilewati` : ''}`
            : `Imported ${imported} keys${skipped ? `, skipped ${skipped}` : ''}`);
          onClose();
        } catch (err: unknown) {
          alert(err instanceof Error ? err.message : 'Failed to import backup JSON');
        }
        return;
      }

      const res = ClientStorage.importJSON(content);
      if (res.success) {
        await onWorkspaceReload?.();
        onNotice(language === 'id' ? `Berhasil mengimpor ${res.count} key!` : `Imported ${res.count} keys successfully!`);
        onClose();
      } else {
        alert(res.error || 'Failed to import backup JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    if (!confirm(t.resetConfirm)) return;
    if (useServer) {
      try {
        const owned = await QuotaApi.listProjects();
        for (const project of owned) {
          await QuotaApi.deleteProject(project.id);
        }
        await onWorkspaceReload?.();
        onNotice(language === 'id' ? 'Semua data server telah dihapus' : 'Server workspace cleared');
        onClose();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to reset');
      }
      return;
    }

    ClientStorage.resetAll();
    await onWorkspaceReload?.();
    onNotice(language === 'id' ? 'Semua data telah direset' : 'All data reset to defaults');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0e131f] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Settings className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-white">{t.modalSettingsTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Language Selection */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center gap-2 mb-2 text-white font-semibold">
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>{t.settingsLanguage}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              {t.settingsLanguageDesc}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onLanguageChange('id')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 px-3 text-xs font-semibold transition-all ${
                  language === 'id'
                    ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'border-white/10 bg-black/30 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🇮🇩</span>
                <span>Indonesia (Default)</span>
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 px-3 text-xs font-semibold transition-all ${
                  language === 'en'
                    ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'border-white/10 bg-black/30 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>
          </div>

          {/* Privacy Guarantee Box */}
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-emerald-300">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <strong className="block font-semibold text-white">{t.clientSecurityTitle}</strong>
              <span className="text-[11px] leading-relaxed">
                {t.clientSecurityDesc}
              </span>
            </div>
          </div>

          {/* Backup / Export */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {t.dataPortability}
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-cyan-400" />
                  <span>{t.exportBackup}</span>
                </div>
                <span className="text-[11px] text-slate-400">{keys.length} keys</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-indigo-400" />
                  <span>{t.importBackup}</span>
                </div>
                <span className="text-[11px] text-slate-400">{t.restore}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
              {t.dangerZone}
            </h3>
            <button
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t.resetAllData}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-white/10 bg-black/20">
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
