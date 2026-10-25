'use client';

import React from 'react';
import { DollarSign, KeyRound, AlertOctagon, TrendingDown } from 'lucide-react';
import { SystemStats, Language } from '@/types';
import { TRANSLATIONS } from '@/lib/translations';

interface MetricCardsProps {
  stats: SystemStats;
  language: Language;
}

export function MetricCards({ stats, language }: MetricCardsProps) {
  const t = TRANSLATIONS[language];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Balance */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0e131f]/70 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>{t.metricTotalBalance}</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5 font-mono text-2xl font-bold tracking-tight text-white">
          <span>${stats.totalBalance.toFixed(2)}</span>
          <span className="text-xs font-sans font-normal text-slate-400">USD</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>{t.acrossProviders}</span>
        </div>
      </div>

      {/* Monitored Keys */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0e131f]/70 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>{t.metricMonitoredKeys}</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <KeyRound className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5 font-mono text-2xl font-bold tracking-tight text-white">
          <span>{stats.activeCount}</span>
          <span className="text-xs font-sans font-normal text-slate-400">{t.activeLabel}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span className="text-emerald-400 font-semibold">{stats.healthyCount} {t.healthyLabel}</span>
          <span>•</span>
          <span className="text-slate-400">{t.storedLocally}</span>
        </div>
      </div>

      {/* Low Quota Alerts */}
      <div className={`relative overflow-hidden rounded-xl border p-4 backdrop-blur-md transition-all hover:shadow-lg ${
        stats.dangerCount > 0 
          ? 'border-rose-500/40 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]' 
          : stats.warningCount > 0
          ? 'border-amber-500/30 bg-amber-950/15'
          : 'border-white/10 bg-[#0e131f]/70'
      }`}>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>{t.metricKeysDanger}</span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            stats.dangerCount > 0 
              ? 'bg-rose-500/20 text-rose-400' 
              : 'bg-amber-500/10 text-amber-400'
          }`}>
            <AlertOctagon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2 font-mono text-2xl font-bold tracking-tight">
          <span className={stats.dangerCount > 0 ? 'text-rose-400' : stats.warningCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
            {stats.dangerCount + stats.warningCount}
          </span>
          <span className="text-xs font-sans font-normal text-slate-400">
            {stats.dangerCount > 0 ? `(${stats.dangerCount} ${t.depletedLabel})` : t.keysUnderThreshold}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {stats.dangerCount > 0 ? t.immediateRefill : stats.warningCount > 0 ? t.lowQuotaWarning : t.allFunded}
        </div>
      </div>

      {/* Est. 24h Burn Rate */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0e131f]/70 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>{t.metricRunway}</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5 font-mono text-2xl font-bold tracking-tight text-white">
          <span>~18.4</span>
          <span className="text-xs font-sans font-normal text-slate-400">{t.daysLabel}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="text-slate-400">{t.basedOnBurn}</span>
        </div>
      </div>
    </div>
  );
}
