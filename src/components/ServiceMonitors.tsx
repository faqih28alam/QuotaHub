'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Plus, RotateCw, Trash2 } from 'lucide-react';
import { Language, MonitorRoute, ServiceMonitor } from '@/types';
import { ApiError, QuotaApi } from '@/lib/api';
import { TRANSLATIONS } from '@/lib/translations';
import { getRelativeTime } from '@/lib/utils';

interface ServiceMonitorsProps {
  projectId: string;
  language: Language;
  enabled: boolean;
  onNotice: (message: string) => void;
}

function errorText(code: string | null | undefined, t: (typeof TRANSLATIONS)['en']): string {
  const key = `monitorError_${code || 'generic'}` as keyof typeof t;
  const message = t[key];
  return typeof message === 'string' ? message : t.monitorError_generic;
}

export function ServiceMonitors({ projectId, language, enabled, onNotice }: ServiceMonitorsProps) {
  const t = TRANSLATIONS[language];
  const [monitors, setMonitors] = useState<ServiceMonitor[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [route, setRoute] = useState<MonitorRoute>('public');
  const [isSaving, setIsSaving] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      setMonitors(await QuotaApi.listMonitors(projectId));
      setLoadError(null);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : t.monitorError_generic);
    }
  }, [enabled, projectId, t.monitorError_generic]);

  useEffect(() => {
    void load();
    if (!enabled) return;
    const timer = window.setInterval(() => {
      void load();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [enabled, load]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setIsSaving(true);
    try {
      const created = await QuotaApi.createMonitor({
        projectId,
        name: name.trim(),
        url: url.trim(),
        route,
      });
      setMonitors((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setName('');
      setUrl('');
      setRoute('public');
    } catch (err: unknown) {
      const code = err instanceof ApiError ? err.message : '';
      onNotice(errorText(code, t));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheck = async (monitor: ServiceMonitor) => {
    setCheckingId(monitor.id);
    try {
      const updated = await QuotaApi.checkMonitor(monitor.id);
      setMonitors((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: unknown) {
      onNotice(err instanceof Error ? err.message : t.monitorError_generic);
    } finally {
      setCheckingId(null);
    }
  };

  const handleDelete = async (monitor: ServiceMonitor) => {
    if (!window.confirm(t.monitorsDeleteConfirm)) return;
    try {
      await QuotaApi.deleteMonitor(monitor.id);
      setMonitors((prev) => prev.filter((item) => item.id !== monitor.id));
    } catch (err: unknown) {
      onNotice(err instanceof Error ? err.message : t.monitorError_generic);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0e131f]/50 p-4 sm:p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-bold text-white">{t.monitorsTitle}</h2>
        </div>
        <p className="mt-1 text-xs text-slate-400 max-w-3xl">{enabled ? t.monitorsHint : t.monitorsSignIn}</p>
      </div>

      {enabled && (
        <>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1.4fr_140px_auto]">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t.monitorsName}
              maxLength={80}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
            />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={route === 'tailscale' ? 'http://100.x.x.x:8080/health' : 'https://api.example.com/health'}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none font-mono"
            />
            <select
              value={route}
              onChange={(event) => setRoute(event.target.value as MonitorRoute)}
              aria-label={t.monitorsRoute}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="public">{t.monitorsRoutePublic}</option>
              <option value="tailscale">{t.monitorsRouteTailscale}</option>
            </select>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.monitorsAdd}</span>
            </button>
          </form>
          {route === 'tailscale' && (
            <p className="text-[11px] text-slate-500">{t.monitorsTailscaleHint}</p>
          )}
          {loadError && <p className="text-xs text-rose-300">{loadError}</p>}
          {monitors.length === 0 ? (
            <p className="text-xs text-slate-500">{t.monitorsEmpty}</p>
          ) : (
            <ul className="space-y-2">
              {monitors.map((monitor) => {
                const tone = monitor.status === 'up'
                  ? 'bg-emerald-400'
                  : monitor.status === 'down'
                    ? 'bg-rose-400'
                    : 'bg-slate-500';
                const label = monitor.status === 'up'
                  ? t.monitorsUp
                  : monitor.status === 'down'
                    ? t.monitorsDown
                    : t.monitorsUnknown;
                return (
                  <li key={monitor.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${tone}`} />
                        <span className="text-xs font-semibold text-white truncate">{monitor.name}</span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-500">{monitor.route}</span>
                      </div>
                      <p className="mt-1 truncate font-mono text-[11px] text-slate-400">{monitor.url}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {label}
                        {monitor.statusCode ? ` · HTTP ${monitor.statusCode}` : ''}
                        {typeof monitor.latencyMs === 'number' ? ` · ${monitor.latencyMs} ms ${t.monitorsLatency}` : ''}
                        {monitor.lastChecked ? ` · ${getRelativeTime(monitor.lastChecked)}` : ''}
                        {monitor.error ? ` · ${errorText(monitor.error, t)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleCheck(monitor)}
                        disabled={checkingId === monitor.id}
                        className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-60"
                      >
                        <RotateCw className={`h-3.5 w-3.5 ${checkingId === monitor.id ? 'animate-spin' : ''}`} />
                        <span>{t.monitorsCheck}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(monitor)}
                        title={t.monitorsDelete}
                        className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
