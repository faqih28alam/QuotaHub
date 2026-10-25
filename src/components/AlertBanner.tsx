'use client';

import React from 'react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { ApiKeyItem, Language } from '@/types';
import { PROVIDERS } from '@/lib/providers';
import { TRANSLATIONS } from '@/lib/translations';

interface AlertBannerProps {
  criticalKeys: ApiKeyItem[];
  language: Language;
}

export function AlertBanner({ criticalKeys, language }: AlertBannerProps) {
  if (criticalKeys.length === 0) return null;

  const t = TRANSLATIONS[language];
  const firstKey = criticalKeys[0];
  const provider = PROVIDERS[firstKey.providerId];

  return (
    <div className="w-full border-b border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-rose-950/40 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 text-rose-200">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 shrink-0">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <span>
            <strong className="font-semibold text-white">
              {criticalKeys.length} {t.alertKeysAttention}
            </strong>{' '}
            {firstKey.label} ({provider?.name || firstKey.providerId}) {t.alertBalanceDownTo}{' '}
            <strong className="text-rose-400">${firstKey.balance.toFixed(2)}</strong> ({t.alertBelowThreshold} ${firstKey.alertThreshold.toFixed(2)}).
          </span>
        </div>

        {provider?.topUpUrl && (
          <a
            href={provider.topUpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded bg-rose-500/20 px-2 py-1 font-semibold text-rose-300 transition-colors hover:bg-rose-500/30 hover:text-white shrink-0"
          >
            <span>{t.topUpOn} {provider.name}</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
