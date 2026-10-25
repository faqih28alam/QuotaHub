'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  LogIn, 
  UserPlus, 
  UserCheck, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle,
  Globe,
  Check
} from 'lucide-react';
import { AuthUser, Language } from '@/types';
import { ClientStorage } from '@/lib/storage';
import { ApiError, QuotaApi } from '@/lib/api';
import { TRANSLATIONS } from '@/lib/translations';

interface LoginPortalProps {
  onLoginSuccess: (user: AuthUser) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LoginPortal({
  onLoginSuccess,
  language,
  onLanguageChange
}: LoginPortalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'guest'>('signin');
  
  // Sign In State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign Up State
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = TRANSLATIONS[language];

  const unreachableMessage = language === 'id'
    ? 'Server API tidak dapat dihubungi. Jalankan backend di port 8000, atau gunakan Mode Tamu.'
    : 'API server is unreachable. Start the backend on port 8000, or use Guest mode.';

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const user = await QuotaApi.login(loginUsername.trim(), loginPassword);
      ClientStorage.setAuthUser(user);
      onLoginSuccess(user);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 0) {
        setErrorMsg(unreachableMessage);
      } else {
        setErrorMsg(err instanceof Error ? err.message : t.authInvalidCreds);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signupUsername.trim() || !signupPassword.trim()) {
      setErrorMsg(t.authFillAllFields);
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg(t.authPasswordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await QuotaApi.register(
        signupUsername.trim(),
        signupPassword,
        signupEmail.trim() || undefined
      );
      ClientStorage.setAuthUser(user);
      onLoginSuccess(user);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 0) {
        setErrorMsg(unreachableMessage);
      } else {
        setErrorMsg(err instanceof Error ? err.message : t.authFillAllFields);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guest Mode Handler
  const handleGuestLogin = () => {
    const guestUser: AuthUser = {
      username: 'guest',
      displayName: t.guestUser,
      role: 'guest',
      isGuest: true
    };
    ClientStorage.setDemoMode(true);
    ClientStorage.setAuthUser(guestUser);
    onLoginSuccess(guestUser);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#07090e] overflow-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed top-[-10%] left-[20%] -z-10 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[20%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Language Switcher in top right corner */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0e131f]/80 p-1 text-xs">
        <button
          onClick={() => onLanguageChange('id')}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition-all ${
            language === 'id' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🇮🇩 ID</span>
        </button>
        <button
          onClick={() => onLanguageChange('en')}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition-all ${
            language === 'en' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🇬🇧 EN</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0e131f]/85 p-6 sm:p-8 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Glow Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] mb-3">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Quota<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Hub</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xs">
            {t.authPortalSubtitle}
          </p>
        </div>

        {/* Tabs: Sign In / Sign Up / Guest Mode */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/40 p-1 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setErrorMsg(null); }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
              activeTab === 'signin'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{t.authSignInTab}</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
              activeTab === 'signup'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>{t.authSignUpTab}</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('guest'); setErrorMsg(null); }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
              activeTab === 'guest'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>{t.authGuestTab}</span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {t.authUsernameLabel}
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="username"
                required
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {t.authPasswordLabel}
                </label>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 pr-10 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showLoginPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              <span>{isSubmitting ? '...' : t.authSignInBtn}</span>
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {t.authUsernameLabel}
              </label>
              <input
                type="text"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                placeholder="developer_pro"
                required
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {t.authEmailLabel}
              </label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="dev@example.com"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {t.authPasswordLabel}
              </label>
              <div className="relative">
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 pr-10 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showSignupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {t.authConfirmPasswordLabel}
              </label>
              <input
                type="password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              <span>{isSubmitting ? '...' : t.authSignUpBtn}</span>
            </button>
          </form>
        )}

        {/* TAB 3: GUEST MODE */}
        {activeTab === 'guest' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Sandbox Mode</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                {t.authGuestNotice}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 border border-white/15 py-2.5 text-xs font-bold text-white hover:bg-white/15 hover:border-cyan-500/40 transition-all active:scale-[0.98]"
            >
              <UserCheck className="h-4 w-4 text-cyan-400" />
              <span>{t.authGuestBtn}</span>
            </button>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Client-Side Local Storage Privacy</span>
        </div>
      </div>
    </div>
  );
}
