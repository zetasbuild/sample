'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  LogOut,
  ExternalLink,
  Globe,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Loader2,
  Bookmark,
  KeyRound,
  Eye,
  EyeOff,
  Columns2,
  CheckCircle2,
  Play
} from 'lucide-react';
import { YouTubeIcon } from '@/components/Icons';
import { PresetItem, HistoryItem, ProxySettings } from '@/types';
import { parseYouTubeUrl } from '@/components/YouTubePanel';
import { normalizeWebUrl } from '@/components/WebsitePanel';

export default function AdminPage() {
  const router = useRouter();
  const [adminView, setAdminView] = useState<'youtube' | 'website' | 'split' | 'credentials'>('youtube');
  const [loading, setLoading] = useState(true);
  const [adminUsername, setAdminUsername] = useState<string>('admin');

  // Presets state
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [presetSubmitting, setPresetSubmitting] = useState(false);
  const [presetMsg, setPresetMsg] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Settings state
  const [settings, setSettings] = useState<ProxySettings>({
    enabled: true,
    userAgent: ''
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Credentials change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credSaving, setCredSaving] = useState(false);
  const [credMsg, setCredMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Live Test Previews inside Admin
  const [testYtEmbed, setTestYtEmbed] = useState<string | null>(null);
  const [testWebUrl, setTestWebUrl] = useState<string | null>(null);

  // Verify auth on mount
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.authenticated) {
          router.push('/login');
          return;
        }
        setAdminUsername(data.user.username);
        setNewUsernameInput(data.user.username);

        await Promise.all([
          loadPresets(), 
          loadHistory(), 
          loadSettings(),
          loadCredentials()
        ]);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const loadPresets = async () => {
    try {
      const res = await fetch('/api/presets');
      if (res.ok) {
        const data = await res.json();
        setPresets(data.presets || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCredentials = async () => {
    try {
      const res = await fetch('/api/auth/credentials');
      if (res.ok) {
        const data = await res.json();
        if (data.credentials) {
          setAdminUsername(data.credentials.username);
          setNewUsernameInput(data.credentials.username);
          setCurrentPassword(data.credentials.password || '');
          setNewPasswordInput(data.credentials.password || '');
          setConfirmPasswordInput(data.credentials.password || '');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  // Add Preset Handler
  const handleAddPreset = async (targetType: 'youtube' | 'website') => {
    if (!newTitle.trim() || !newUrl.trim()) return;

    setPresetSubmitting(true);
    setPresetMsg(null);

    try {
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          url: newUrl.trim(),
          type: targetType,
          description: newDesc.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewTitle('');
        setNewUrl('');
        setNewDesc('');
        setPresetMsg(`New ${targetType === 'youtube' ? 'YouTube' : 'Website'} preset added successfully!`);
        await loadPresets();
      } else {
        setPresetMsg(data.message || 'Failed to add preset');
      }
    } catch {
      setPresetMsg('Error adding preset');
    } finally {
      setPresetSubmitting(false);
    }
  };

  // Delete Preset Handler
  const handleDeletePreset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return;
    try {
      const res = await fetch(`/api/presets?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPresets((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Clear History Handler
  const handleClearHistory = async (type?: 'youtube' | 'website') => {
    const label = type ? `${type} history` : 'all history';
    if (!confirm(`Clear ${label}?`)) return;
    try {
      const endpoint = type ? `/api/history?type=${type}` : '/api/history';
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        await loadHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSettingsMsg('Proxy settings updated successfully!');
      } else {
        setSettingsMsg('Failed to update settings');
      }
    } catch {
      setSettingsMsg('Error updating settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Set Username & Password Handler
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMsg(null);

    if (newUsernameInput.trim().length < 2) {
      setCredMsg({ text: 'Username must be at least 2 characters', type: 'error' });
      return;
    }

    if (newPasswordInput.trim().length < 4) {
      setCredMsg({ text: 'Password must be at least 4 characters', type: 'error' });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setCredMsg({ text: 'Passwords do not match. Please verify.', type: 'error' });
      return;
    }

    setCredSaving(true);
    try {
      const res = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsernameInput.trim(),
          password: newPasswordInput.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdminUsername(newUsernameInput.trim());
        setCurrentPassword(newPasswordInput.trim());
        setCredMsg({
          text: `Success! Login credentials updated. Username: "${newUsernameInput.trim()}"`,
          type: 'success'
        });
      } else {
        setCredMsg({ text: data.message || 'Failed to update credentials', type: 'error' });
      }
    } catch {
      setCredMsg({ text: 'Network error updating credentials', type: 'error' });
    } finally {
      setCredSaving(false);
    }
  };

  const handleTestYouTube = (rawUrl: string) => {
    const parsed = parseYouTubeUrl(rawUrl);
    if (parsed) {
      setTestYtEmbed(`https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=1`);
    }
  };

  const handleTestWebsite = (rawUrl: string) => {
    const normalized = normalizeWebUrl(rawUrl);
    if (normalized) {
      const src = settings.enabled
        ? `/api/proxy?url=${encodeURIComponent(normalized)}`
        : normalized;
      setTestWebUrl(src);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        <span>Loading Admin Panel...</span>
      </div>
    );
  }

  const ytPresets = presets.filter((p) => p.type === 'youtube');
  const webPresets = presets.filter((p) => p.type === 'website');
  const ytHistory = history.filter((h) => h.type === 'youtube');
  const webHistory = history.filter((h) => h.type === 'website');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">DualView Admin Panel</h1>
                <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                  {adminUsername}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Two separate views: YouTube Manager &amp; Website Manager + Credential Settings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>Dual Panel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* VIEW SELECTOR TABS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* View 1: YouTube Admin */}
            <button
              onClick={() => setAdminView('youtube')}
              className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                adminView === 'youtube'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <YouTubeIcon className="w-4 h-4" />
              <span>YouTube Admin View ({ytPresets.length})</span>
            </button>

            {/* View 2: Website Admin */}
            <button
              onClick={() => setAdminView('website')}
              className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                adminView === 'website'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Website Admin View ({webPresets.length})</span>
            </button>

            {/* Split Dual Admin View */}
            <button
              onClick={() => setAdminView('split')}
              className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                adminView === 'split'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Columns2 className="w-4 h-4" />
              <span>Split Dual Admin</span>
            </button>
          </div>

          {/* Credentials Manager Button */}
          <button
            onClick={() => setAdminView('credentials')}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg transition-all ${
              adminView === 'credentials'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Set Login Username &amp; Password</span>
          </button>
        </div>

        {/* Global Preset Alert */}
        {presetMsg && (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs p-3 rounded-lg flex items-center justify-between">
            <span>{presetMsg}</span>
            <button onClick={() => setPresetMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: YOUTUBE ADMIN PANEL
           ========================================================================= */}
        {(adminView === 'youtube' || adminView === 'split') && (
          <div className={`space-y-6 ${adminView === 'split' ? 'border border-red-500/30 p-4 rounded-xl bg-slate-900/40' : ''}`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
                  <YouTubeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">YouTube Admin View</h2>
                  <p className="text-xs text-slate-400">
                    Manage YouTube presets, test playback, and review watch history
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
                {ytPresets.length} Presets • {ytHistory.length} Plays
              </span>
            </div>

            {/* Add YouTube Preset Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-red-400" />
                <span>Add YouTube Preset</span>
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddPreset('youtube');
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Label / Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. 🎧 Synthwave Coding"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-400">YouTube URL</label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-400">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. Focus beats with live synth visualizer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={presetSubmitting}
                    className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save YouTube Preset</span>
                  </button>
                </div>
              </form>
            </div>

            {/* YouTube Presets List & Embedded Test Player */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Presets List */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-red-400" />
                    <span>YouTube Presets ({ytPresets.length})</span>
                  </h4>
                </div>
                <div className="divide-y divide-slate-800 max-h-[360px] overflow-y-auto">
                  {ytPresets.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No YouTube presets added yet.
                    </div>
                  ) : (
                    ytPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="overflow-hidden">
                          <h5 className="text-xs font-semibold text-slate-200 truncate">
                            {preset.title}
                          </h5>
                          <p className="text-[11px] font-mono text-slate-400 truncate">
                            {preset.url}
                          </p>
                          {preset.description && (
                            <p className="text-[11px] text-slate-500 truncate">{preset.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleTestYouTube(preset.url)}
                            className="p-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Test Play in Admin"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <a
                            href={preset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Open in YouTube"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* YouTube Live Test Player in Admin */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Live Player Test</span>
                  {testYtEmbed && (
                    <button
                      onClick={() => setTestYtEmbed(null)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  )}
                </div>
                <div className="flex-1 min-h-[220px] bg-black flex items-center justify-center">
                  {testYtEmbed ? (
                    <iframe
                      src={testYtEmbed}
                      title="Test YouTube Player"
                      className="w-full h-full min-h-[220px] border-0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="text-center p-4 text-xs text-slate-500">
                      Click the <Play className="w-3 h-3 inline fill-current text-red-500" /> icon next to any preset to test playback here.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* YouTube Activity History */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    YouTube Watch History ({ytHistory.length})
                  </h4>
                </div>
                {ytHistory.length > 0 && (
                  <button
                    onClick={() => handleClearHistory('youtube')}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear YouTube History</span>
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-800 max-h-[200px] overflow-y-auto">
                {ytHistory.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No YouTube activity logged yet.
                  </div>
                ) : (
                  ytHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between text-xs hover:bg-slate-800/30"
                    >
                      <span className="font-mono text-slate-300 truncate max-w-lg">{item.url}</span>
                      <span className="text-[11px] text-slate-500 shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: WEBSITE ADMIN PANEL
           ========================================================================= */}
        {(adminView === 'website' || adminView === 'split') && (
          <div className={`space-y-6 ${adminView === 'split' ? 'border border-blue-500/30 p-4 rounded-xl bg-slate-900/40' : ''}`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Website Admin View</h2>
                  <p className="text-xs text-slate-400">
                    Manage Website bookmarks, configure Smart Bypass proxy, and view browsing history
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                {webPresets.length} Bookmarks • {webHistory.length} Visits
              </span>
            </div>

            {/* Smart Bypass Proxy Settings Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Smart Bypass Proxy Settings</span>
                </h3>
                {settingsMsg && (
                  <span className="text-xs text-emerald-400">{settingsMsg}</span>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">
                      Bypass X-Frame-Options &amp; CSP Headers
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Allows embedding sites like Wikipedia, Hacker News, MDN, OpenStreetMap directly into iframes.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">
                    Proxy User-Agent Header
                  </label>
                  <input
                    type="text"
                    value={settings.userAgent}
                    onChange={(e) => setSettings({ ...settings, userAgent: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold py-1.5 px-4 rounded-lg transition-colors"
                >
                  {settingsSaving ? 'Saving...' : 'Save Proxy Settings'}
                </button>
              </form>
            </div>

            {/* Add Website Bookmark Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Add Website Bookmark Preset</span>
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddPreset('website');
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Title / Label</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. 📖 Wikipedia"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-400">Website URL</label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://en.wikipedia.org"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-400">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. The Free Encyclopedia"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={presetSubmitting}
                    className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Website Preset</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Website Bookmarks List & Embedded Test Frame */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Bookmarks List */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                    <span>Website Bookmarks ({webPresets.length})</span>
                  </h4>
                </div>
                <div className="divide-y divide-slate-800 max-h-[360px] overflow-y-auto">
                  {webPresets.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No website bookmarks added yet.
                    </div>
                  ) : (
                    webPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="overflow-hidden">
                          <h5 className="text-xs font-semibold text-slate-200 truncate">
                            {preset.title}
                          </h5>
                          <p className="text-[11px] font-mono text-slate-400 truncate">
                            {preset.url}
                          </p>
                          {preset.description && (
                            <p className="text-[11px] text-slate-500 truncate">{preset.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleTestWebsite(preset.url)}
                            className="p-1.5 text-xs text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                            title="Test Preview in Admin"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={preset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Open New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Website Live Test Preview in Admin */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Live Web Preview</span>
                  {testWebUrl && (
                    <button
                      onClick={() => setTestWebUrl(null)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  )}
                </div>
                <div className="flex-1 min-h-[220px] bg-white flex items-center justify-center">
                  {testWebUrl ? (
                    <iframe
                      src={testWebUrl}
                      title="Test Website Preview"
                      className="w-full h-full min-h-[220px] border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  ) : (
                    <div className="text-center p-4 text-xs text-slate-500">
                      Click the <Globe className="w-3 h-3 inline text-blue-500" /> icon next to any bookmark to test embed preview.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Website Activity History */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Website Browsing History ({webHistory.length})
                  </h4>
                </div>
                {webHistory.length > 0 && (
                  <button
                    onClick={() => handleClearHistory('website')}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Website History</span>
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-800 max-h-[200px] overflow-y-auto">
                {webHistory.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No website activity logged yet.
                  </div>
                ) : (
                  webHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between text-xs hover:bg-slate-800/30"
                    >
                      <span className="font-mono text-slate-300 truncate max-w-lg">{item.url}</span>
                      <span className="text-[11px] text-slate-500 shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CREDENTIALS & SECURITY: SET LOGIN USERNAME & PASSWORD
           ========================================================================= */}
        {adminView === 'credentials' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">Set Login Username &amp; Password</h2>
              <p className="text-xs text-slate-400">
                Update the admin credentials used to log into the Admin Control Panel.
              </p>
            </div>

            {credMsg && (
              <div
                className={`text-xs p-3 rounded-lg flex items-center gap-2 ${
                  credMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {credMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <span>⚠️</span>
                )}
                <span>{credMsg.text}</span>
              </div>
            )}

            {/* Current Active Credentials Callout */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Login Username:</span>
                <span className="font-mono font-bold text-emerald-400">{adminUsername}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Password:</span>
                <span className="font-mono text-slate-300">
                  {showPassword ? currentPassword : '••••••••••••'}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  New Admin Username
                </label>
                <input
                  type="text"
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value)}
                  placeholder="Enter new username (e.g. zetasbuild)"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    New Admin Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password (min 4 chars)"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-type new password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={credSaving}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg shadow-lg shadow-amber-600/20 transition-all"
              >
                {credSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Credentials...</span>
                  </>
                ) : (
                  <span>Update Admin Credentials</span>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
