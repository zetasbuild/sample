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
  Settings,
  Sparkles,
  Loader2,
  Bookmark
} from 'lucide-react';
import { YouTubeIcon } from '@/components/Icons';
import { PresetItem, HistoryItem, ProxySettings } from '@/types';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'presets' | 'history' | 'settings'>('presets');
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);

  // Presets state
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [presetTypeFilter, setPresetTypeFilter] = useState<'all' | 'youtube' | 'website'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'youtube' | 'website'>('youtube');
  const [newDesc, setNewDesc] = useState('');
  const [presetSubmitting, setPresetSubmitting] = useState(false);
  const [presetMsg, setPresetMsg] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<ProxySettings>({
    enabled: true,
    userAgent: ''
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

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
        setAdminUser(data.user);
        await Promise.all([loadPresets(), loadHistory(), loadSettings()]);
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
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  // Add Preset Handler
  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault();
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
          type: newType,
          description: newDesc.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewTitle('');
        setNewUrl('');
        setNewDesc('');
        setPresetMsg('Preset added successfully!');
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
  const handleClearHistory = async () => {
    if (!confirm('Clear all logged activity?')) return;
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
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
        setSettingsMsg('Settings saved successfully!');
      } else {
        setSettingsMsg('Failed to update settings');
      }
    } catch {
      setSettingsMsg('Error updating settings');
    } finally {
      setSettingsSaving(false);
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

  const filteredPresets = presets.filter((p) => {
    if (presetTypeFilter === 'all') return true;
    return p.type === presetTypeFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">DualView Admin</h1>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  Logged in as {adminUser?.username}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage presets, review activity, and configure proxy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>View Dual Panel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              activeTab === 'presets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Manage Presets ({presets.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              loadHistory();
            }}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Activity Logs ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Proxy &amp; Settings</span>
          </button>
        </div>

        {/* TAB 1: PRESETS MANAGER */}
        {activeTab === 'presets' && (
          <div className="space-y-6">
            {/* Add Preset Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Add New Preset Quick Link</span>
              </h2>

              {presetMsg && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs p-2.5 rounded-lg">
                  {presetMsg}
                </div>
              )}

              <form onSubmit={handleAddPreset} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Title / Label</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. 🎵 Lofi Chill"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Target Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'youtube' | 'website')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value="youtube">YouTube Video</option>
                    <option value="website">Website URL</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-medium text-slate-400">URL</label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://www.youtube.com/... or https://..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="text-[11px] font-medium text-slate-400">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Optional tooltip or description for the preset"
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
                    <span>Save Preset</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Presets List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-200">Active Presets</h3>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setPresetTypeFilter('all')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      presetTypeFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({presets.length})
                  </button>
                  <button
                    onClick={() => setPresetTypeFilter('youtube')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      presetTypeFilter === 'youtube'
                        ? 'bg-red-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    YouTube ({presets.filter((p) => p.type === 'youtube').length})
                  </button>
                  <button
                    onClick={() => setPresetTypeFilter('website')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      presetTypeFilter === 'website'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Website ({presets.filter((p) => p.type === 'website').length})
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-800">
                {filteredPresets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No presets configured for this filter.
                  </div>
                ) : (
                  filteredPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            preset.type === 'youtube'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {preset.type === 'youtube' ? (
                            <YouTubeIcon className="w-4 h-4" />
                          ) : (
                            <Globe className="w-4 h-4" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-semibold text-slate-200 truncate">
                            {preset.title}
                          </h4>
                          <p className="text-[11px] font-mono text-slate-400 truncate">
                            {preset.url}
                          </p>
                          {preset.description && (
                            <p className="text-[11px] text-slate-500 truncate">
                              {preset.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={preset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Open Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeletePreset(preset.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete Preset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVITY LOGS */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-0">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Recent User Activity</h3>
                <p className="text-xs text-slate-500">
                  Links that were pasted and viewed in the dual panel
                </p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Logs</span>
                </button>
              )}
            </div>

            {historyLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Loading logs...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No activity logged yet. Paste and play links on the home page to see them recorded here.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          item.type === 'youtube'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {item.type}
                      </span>
                      <p className="text-xs font-mono text-slate-300 truncate">{item.url}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-slate-500 text-[11px]">
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROXY & SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Smart Bypass Proxy Settings</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure how the website viewer bypasses embedding restrictions (`X-Frame-Options` and CSP)
              </p>
            </div>

            {settingsMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg">
                {settingsMsg}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Enable Smart Bypass Proxy
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Allows embedding websites like Wikipedia and docs that normally block iframes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Custom User-Agent Header
                </label>
                <input
                  type="text"
                  value={settings.userAgent}
                  onChange={(e) => setSettings({ ...settings, userAgent: e.target.value })}
                  placeholder="Default browser user agent string"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition-all"
              >
                {settingsSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
