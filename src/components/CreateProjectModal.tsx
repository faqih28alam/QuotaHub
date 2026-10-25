'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Bot, Sparkles, TrendingUp, Boxes } from 'lucide-react';
import { Project, Language } from '@/types';
import { TRANSLATIONS } from '@/lib/translations';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void | Promise<void>;
  language: Language;
}

const AVAILABLE_COLORS = [
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Blue', value: '#3b82f6' }
];

const AVAILABLE_ICONS = [
  { id: 'Bot', label: 'Bot', icon: Bot },
  { id: 'Sparkles', label: 'AI/LLM', icon: Sparkles },
  { id: 'TrendingUp', label: 'Growth', icon: TrendingUp },
  { id: 'Boxes', label: 'General', icon: Boxes }
];

export function CreateProjectModal({
  isOpen,
  onClose,
  onSave,
  language
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#06b6d4');
  const [icon, setIcon] = useState('Bot');

  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      createdAt: new Date().toISOString()
    };

    await onSave(newProject);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0e131f] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <FolderPlus className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-white">{t.modalCreateProjectTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.modalProjectName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.modalProjectNamePlaceholder}
              required
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.modalProjectDesc}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.modalProjectDescPlaceholder}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.modalAccentColor}
            </label>
            <div className="flex items-center gap-2.5">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c.value ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.modalIcon}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map((i) => {
                const IconComp = i.icon;
                const isSelected = icon === i.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setIcon(i.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <IconComp className="h-5 w-5 mb-1" />
                    <span>{i.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
              {t.modalCreateBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
