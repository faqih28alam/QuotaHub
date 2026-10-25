'use client';

import React, { useState } from 'react';
import { X, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, RotateCw } from 'lucide-react';
import { KeyDraft, ProviderId, Project, Language } from '@/types';
import { PROVIDERS } from '@/lib/providers';
import { ApiError, QuotaApi } from '@/lib/api';
import { TRANSLATIONS } from '@/lib/translations';

interface AddKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: KeyDraft) => void | Promise<void>;
  activeProject: Project | null;
  projects: Project[];
  language: Language;
  useServer?: boolean;
}

export function AddKeyModal({ 
  isOpen, 
  onClose, 
  onSave,
  activeProject,
  projects,
  language,
  useServer = false
}: AddKeyModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProject?.id || projects[0]?.id || '');
  const [providerId, setProviderId] = useState<ProviderId>('tikhub');
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [threshold, setThreshold] = useState('2.0');
  const [maxQuota, setMaxQuota] = useState('20.0');
  const [notes, setNotes] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const currentProvider = PROVIDERS[providerId];
  const targetProject = projects.find(p => p.id === (activeProject?.id || selectedProjectId)) || projects[0];

  const handleTestKey = async () => {
    if (!apiKey) {
      setTestResult({ success: false, msg: t.modalKeyRequired });
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    try {
      const alertThreshold = parseFloat(threshold) || 2.0;
      const quota = parseFloat(maxQuota) || 20.0;
      if (useServer) {
        const data = await QuotaApi.testKey({
          providerId,
          apiKey: apiKey.trim(),
          endpoint: providerId === 'custom' ? endpoint.trim() : undefined,
          alertThreshold,
          maxQuota: quota,
        });
        setTestResult({
          success: true,
          msg: `${t.modalVerified} $${(data.balance || 0).toFixed(2)}`
        });
      } else {
        const res = await fetch('/api/check-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            apiKey,
            endpoint,
            alertThreshold,
            maxQuota: quota
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setTestResult({
            success: true,
            msg: `${t.modalVerified} $${(data.balance || 0).toFixed(2)}`
          });
        } else {
          setTestResult({
            success: false,
            msg: data.error || 'Connection failed'
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Error';
      setTestResult({ success: false, msg });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;

    const pId = activeProject?.id || selectedProjectId || projects[0]?.id;
    if (!pId) return;

    try {
      await onSave({
        projectId: pId,
        providerId,
        label: label.trim() || `${currentProvider.name} Key`,
        apiKey: apiKey.trim(),
        endpoint: providerId === 'custom' ? endpoint.trim() : undefined,
        alertThreshold: parseFloat(threshold) || currentProvider.defaultThreshold,
        maxQuota: parseFloat(maxQuota) || 20.0,
        notes: notes.trim(),
        currency: currentProvider.currency || '$',
      });
      onClose();
    } catch {
      // The page already surfaces the error toast. Keep the form open.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e131f] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.modalAddKeyTitle}</h2>
              {targetProject && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>{t.modalToProject}</span>
                  <span className="font-semibold text-cyan-400">{targetProject.name}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Project selector if no active project */}
          {!activeProject && projects.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t.modalAssignToProject}
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-cyan-500/50 focus:outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Provider Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.modalSelectProvider}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.values(PROVIDERS).map((p) => {
                const isSelected = providerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProviderId(p.id);
                      setThreshold(String(p.defaultThreshold));
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span 
                      className="flex h-7 w-7 items-center justify-center rounded mb-1 text-xs font-bold"
                      style={{ backgroundColor: `${p.color}20`, color: p.color }}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="truncate w-full text-center">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Label */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.modalLabel}
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t.modalLabelPlaceholder}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t.modalApiKey}
              </label>
              <span className="text-[11px] text-slate-500">{t.modal100PercentClient}</span>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={currentProvider.keyPlaceholder}
                required
                className="w-full font-mono rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 pr-10 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Custom Endpoint Field if Custom Provider */}
          {providerId === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t.modalCustomEndpoint}
              </label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1/user/balance"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
          )}

          {/* Threshold & Max Quota */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t.modalLowAlert}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full font-mono rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t.modalMaxQuota}
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={maxQuota}
                onChange={(e) => setMaxQuota(e.target.value)}
                className="w-full font-mono rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          {/* Test Connection Button & Status */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? t.modalVerifying : t.modalTestConnection}</span>
            </button>

            {testResult && (
              <div className={`mt-2 flex items-center gap-2 rounded-lg p-2.5 text-xs ${
                testResult.success 
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300' 
                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.modalNotes}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.modalNotesPlaceholder}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              {t.modalCancel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              {t.modalSaveKey}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
