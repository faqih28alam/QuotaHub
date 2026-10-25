'use client';

import React, { useState } from 'react';
import { Copy, Check, RotateCw, ExternalLink, Trash2 } from 'lucide-react';
import { ApiKeyItem, Language } from '@/types';
import { PROVIDERS } from '@/lib/providers';
import { getRelativeTime, maskKey } from '@/lib/utils';
import { TRANSLATIONS } from '@/lib/translations';

interface ProviderTableProps {
  keys: ApiKeyItem[];
  onRefresh: (keyItem: ApiKeyItem) => Promise<void>;
  onDelete: (id: string) => void;
  onCopyNotice: (msg: string) => void;
  language: Language;
}

export function ProviderTable({
  keys,
  onRefresh,
  onDelete,
  onCopyNotice,
  language
}: ProviderTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const t = TRANSLATIONS[language];

  const handleCopy = async (key: ApiKeyItem) => {
    if (!key.apiKey) {
      onCopyNotice(language === 'id'
        ? 'Key tersimpan terenkripsi di server'
        : 'Key is encrypted on the server');
      return;
    }
    try {
      await navigator.clipboard.writeText(key.apiKey);
      setCopiedId(key.id);
      onCopyNotice(`${t.copiedKey}: ${key.label}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onCopyNotice('Gagal menyalin');
    }
  };

  const handleCheck = async (key: ApiKeyItem) => {
    setCheckingId(key.id);
    try {
      await onRefresh(key);
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0e131f]/70 backdrop-blur-md">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-white/10 bg-black/30 uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">{t.tableService}</th>
            <th className="px-4 py-3 font-semibold">{t.tableLabel}</th>
            <th className="px-4 py-3 font-semibold">{t.tableApiKey}</th>
            <th className="px-4 py-3 font-semibold">{t.tableBalance}</th>
            <th className="px-4 py-3 font-semibold">{t.tableStatus}</th>
            <th className="px-4 py-3 font-semibold">{t.tableLastChecked}</th>
            <th className="px-4 py-3 text-right font-semibold">{t.tableActions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {keys.map((k) => {
            const provider = PROVIDERS[k.providerId] || PROVIDERS.custom;
            return (
              <tr key={k.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium text-white">
                  <div className="flex items-center gap-2">
                    <span 
                      className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold"
                      style={{ backgroundColor: `${provider.color}20`, color: provider.color }}
                    >
                      {provider.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span>{provider.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300 font-medium">
                  {k.label}
                </td>
                <td className="px-4 py-3 font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span>{k.maskedKey || maskKey(k.apiKey)}</span>
                    <button
                      onClick={() => handleCopy(k)}
                      className="text-slate-500 hover:text-white transition-colors p-0.5"
                      title={t.copyKey}
                    >
                      {copiedId === k.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono font-semibold">
                  <span className={k.status === 'danger' ? 'text-rose-400' : k.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}>
                    ${k.balance.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                    k.status === 'danger' 
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' 
                      : k.status === 'warning' 
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' 
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  }`}>
                    <span className={`h-1 w-1 rounded-full ${k.status === 'danger' ? 'bg-rose-400' : k.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    {k.status === 'danger' ? t.statusDepleted : k.status === 'warning' ? t.statusLowQuota : t.statusHealthy}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {getRelativeTime(k.lastChecked)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleCheck(k)}
                      disabled={checkingId === k.id}
                      className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
                      title={t.checkRealtime}
                    >
                      <RotateCw className={`h-3 w-3 ${checkingId === k.id ? 'animate-spin text-cyan-400' : ''}`} />
                    </button>
                    {provider.topUpUrl && (
                      <a
                        href={provider.topUpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-slate-400 hover:text-cyan-400"
                        title="Top Up"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`${t.deleteKeyConfirm} "${k.label}"?`)) onDelete(k.id);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                      title="Hapus Key"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
