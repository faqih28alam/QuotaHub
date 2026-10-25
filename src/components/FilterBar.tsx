'use client';

import React from 'react';
import { Search, LayoutGrid, Table } from 'lucide-react';
import { Language } from '@/types';
import { PROVIDERS } from '@/lib/providers';
import { TRANSLATIONS } from '@/lib/translations';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  language: Language;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedProvider,
  onSelectProvider,
  selectedStatus,
  onSelectStatus,
  viewMode,
  onViewModeChange,
  language
}: FilterBarProps) {
  const providerList = Object.values(PROVIDERS);
  const t = TRANSLATIONS[language];

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative min-w-[240px] max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-full border border-white/10 bg-[#0e131f]/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition-all focus:border-cyan-500/50 focus:bg-[#121929] focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {/* Status Filters & View Mode */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1 text-xs">
            <button
              onClick={() => onSelectStatus('all')}
              className={`rounded px-2.5 py-1 font-semibold transition-all ${
                selectedStatus === 'all'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => onSelectStatus('healthy')}
              className={`rounded px-2 py-1 font-semibold transition-all ${
                selectedStatus === 'healthy'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              {t.filterHealthy}
            </button>
            <button
              onClick={() => onSelectStatus('warning')}
              className={`rounded px-2 py-1 font-semibold transition-all ${
                selectedStatus === 'warning'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              {t.filterLowQuota}
            </button>
            <button
              onClick={() => onSelectStatus('danger')}
              className={`rounded px-2 py-1 font-semibold transition-all ${
                selectedStatus === 'danger'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              {t.filterDepleted}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1 text-slate-400">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex h-7 w-7 items-center justify-center rounded transition-all ${
                viewMode === 'grid'
                  ? 'bg-white/10 text-white'
                  : 'hover:text-white'
              }`}
              title={t.gridView}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex h-7 w-7 items-center justify-center rounded transition-all ${
                viewMode === 'table'
                  ? 'bg-white/10 text-white'
                  : 'hover:text-white'
              }`}
              title={t.tableView}
            >
              <Table className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Provider Chips Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => onSelectProvider('all')}
          className={`whitespace-nowrap rounded-full border px-3 py-1 font-medium transition-all ${
            selectedProvider === 'all'
              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          {t.allProviders}
        </button>

        {providerList.map((p) => {
          const isActive = selectedProvider === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectProvider(p.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 font-medium transition-all ${
                isActive
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
