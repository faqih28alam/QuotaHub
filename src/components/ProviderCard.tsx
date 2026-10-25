'use client';

import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RotateCw, 
  ExternalLink, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';
import { ApiKeyItem, Language } from '@/types';
import { PROVIDERS } from '@/lib/providers';
import { getRelativeTime, maskKey } from '@/lib/utils';
import { TRANSLATIONS } from '@/lib/translations';

interface ProviderCardProps {
  keyItem: ApiKeyItem;
  onRefresh: (keyItem: ApiKeyItem) => Promise<void>;
  onDelete: (id: string) => void;
  onCopyNotice: (msg: string) => void;
  language: Language;
}

export function ProviderCard({
  keyItem,
  onRefresh,
  onDelete,
  onCopyNotice,
  language
}: ProviderCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const t = TRANSLATIONS[language];

  const provider = PROVIDERS[keyItem.providerId] || PROVIDERS.custom;
  
  // Calculate percentage remaining
  const max = keyItem.maxQuota > 0 ? keyItem.maxQuota : 20.0;
  const pctRemaining = Math.max(0, Math.min(100, Math.round((keyItem.balance / max) * 100)));

  const secretOnServer = !keyItem.apiKey;

  const handleCopy = async () => {
    if (secretOnServer) {
      onCopyNotice(language === 'id'
        ? 'Key tersimpan terenkripsi di server'
        : 'Key is encrypted on the server');
      return;
    }
    try {
      await navigator.clipboard.writeText(keyItem.apiKey);
      setCopied(true);
      onCopyNotice(`${t.copiedKey}: ${keyItem.label}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onCopyNotice('Gagal menyalin key');
    }
  };

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      await onRefresh(keyItem);
    } finally {
      setIsChecking(false);
    }
  };

  // Status Styling
  const statusBorder = 
    keyItem.status === 'danger'
      ? 'hover:border-rose-500/50 hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]'
      : keyItem.status === 'warning'
      ? 'hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.18)]'
      : 'hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.18)]';

  const gaugeColor = 
    keyItem.status === 'danger'
      ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
      : keyItem.status === 'warning'
      ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
      : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]';

  const statusBadge = 
    keyItem.status === 'danger' ? (
      <span className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
        {t.statusDepleted}
      </span>
    ) : keyItem.status === 'warning' ? (
      <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        {t.statusLowQuota}
      </span>
    ) : (
      <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {t.statusHealthy}
      </span>
    );

  return (
    <div className={`group relative flex flex-col justify-between rounded-xl border border-white/10 bg-[#0e131f]/70 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${statusBorder}`}>
      {/* Glow highlight line */}
      <div 
        className={`absolute top-0 left-0 right-0 h-[2px] transition-all ${
          keyItem.status === 'danger'
            ? 'bg-gradient-to-r from-transparent via-rose-500 to-transparent'
            : keyItem.status === 'warning'
            ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
            : 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
        }`}
      />

      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-sm font-bold shadow-inner"
              style={{ backgroundColor: `${provider.color}15`, color: provider.color }}
            >
              {provider.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {keyItem.label}
                </h3>
              </div>
              <span className={`inline-block text-[11px] font-medium ${provider.badgeBg} border rounded px-1.5 py-0.2 mt-0.5`}>
                {provider.name}
              </span>
            </div>
          </div>

          <div>{statusBadge}</div>
        </div>

        {/* Masked API Key Box */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-xs text-slate-400">
          <span className="truncate tracking-wide select-all">
            {revealed && !secretOnServer ? keyItem.apiKey : keyItem.maskedKey || maskKey(keyItem.apiKey)}
          </span>
          <div className="ml-2 flex items-center gap-1.5">
            {!secretOnServer && (
            <button
              onClick={() => setRevealed(!revealed)}
              className="text-slate-500 hover:text-white transition-colors p-0.5"
              title={revealed ? t.hideKey : t.revealKey}
            >
              {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            )}
            <button
              onClick={handleCopy}
              className="text-slate-500 hover:text-white transition-colors p-0.5"
              title={t.copyKey}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t.availableBalance}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`font-mono text-3xl font-extrabold tracking-tight ${
              keyItem.status === 'danger'
                ? 'text-rose-400'
                : keyItem.status === 'warning'
                ? 'text-amber-400'
                : 'text-white'
            }`}>
              {keyItem.currency === '$' ? `$${keyItem.balance.toFixed(2)}` : `${keyItem.balance.toFixed(1)} ${keyItem.currency}`}
            </span>
            <span className="text-xs text-slate-500">
              / max {keyItem.currency === '$' ? `$${max.toFixed(2)}` : `${max} ${keyItem.currency}`}
            </span>
          </div>
        </div>

        {/* Dynamic Fuel Gauge Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>{t.remainingRunway}</span>
            <span className="font-mono font-semibold">{pctRemaining}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-white/5 bg-white/5 p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${gaugeColor}`}
              style={{ width: `${pctRemaining}%` }}
            />
          </div>
        </div>

        {keyItem.notes && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <AlertCircle className="h-3 w-3 text-slate-500 flex-shrink-0" />
            <span className="truncate">{keyItem.notes}</span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-slate-500">
        <span>{t.checkedAgo} {getRelativeTime(keyItem.lastChecked)}</span>

        <div className="flex items-center gap-1.5">
          {/* Refresh Ping */}
          <button
            onClick={handleCheck}
            disabled={isChecking}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
            title={t.checkRealtime}
          >
            <RotateCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Top-up Link */}
          {provider.topUpUrl && (
            <a
              href={provider.topUpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-cyan-400"
              title={`Top up ${provider.name}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {/* Delete Button */}
          <button
            onClick={() => {
              if (confirm(`${t.deleteKeyConfirm} "${keyItem.label}"?`)) {
                onDelete(keyItem.id);
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
            title="Hapus key"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
