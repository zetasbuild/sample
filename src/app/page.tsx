'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, User, KeyRound, Loader2, Play } from 'lucide-react';
import Navbar from '@/components/Navbar';
import YouTubePanel from '@/components/YouTubePanel';
import { YouTubeIcon } from '@/components/Icons';

export default function HomePage() {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('https://youtu.be/vUjkbW6qM6A');
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Login form state for unauthenticated viewers
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial video and auth status
  useEffect(() => {
    async function loadData() {
      try {
        const [videoRes, authRes] = await Promise.all([
          fetch('/api/video'),
          fetch('/api/auth/me')
        ]);

        if (videoRes.ok) {
          const vData = await videoRes.json();
          if (vData.url) {
            setActiveVideoUrl(vData.url);
          }
        }

        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.user) {
            setCurrentUser(authData.user);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
      } else {
        setLoginError(data.message || 'Invalid username or password');
      }
    } catch {
      setLoginError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillSample = () => {
    setLoginUsername('sample');
    setLoginPassword('sample123');
    setLoginError(null);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-red-600" />
        <span className="font-medium text-sm">Loading Website...</span>
      </div>
    );
  }

  // If user is not logged in, show the website login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        {/* Simple Top Bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-xl">
                <YouTubeIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Video Player
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Protected Stream Access
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Admin Portal
            </Link>
          </div>
        </header>

        {/* Website Login Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 mx-auto flex items-center justify-center shadow-2xs">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Website Login
              </h2>
              <p className="text-xs text-slate-500">
                Please enter your login details to access and watch the video stream.
              </p>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Username</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:bg-white focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 transition-all">
                  <User className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="sample"
                    required
                    className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:bg-white focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 transition-all">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="sample123"
                    required
                    className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In to Watch</span>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Button */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleFillSample}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-red-600" />
                <span>Fill Website Login (sample / sample123)</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Once authenticated, show the video player
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar adminUser={currentUser} onLogout={handleLogout} />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <YouTubePanel videoUrl={activeVideoUrl} />
      </main>
    </div>
  );
}
