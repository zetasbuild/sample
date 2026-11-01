'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ExternalLink, 
  RotateCw, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PresetItem } from '@/types';

interface WebsitePanelProps {
  presets: PresetItem[];
  onOpenSite?: (url: string) => void;
}

export function normalizeWebUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

export default function WebsitePanel({ presets, onOpenSite }: WebsitePanelProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showBlockedHelper, setShowBlockedHelper] = useState(false);

  // Automatically select the first admin-added link when presets load or change
  useEffect(() => {
    if (presets && presets.length > 0) {
      if (!selectedPresetId || !presets.some((p) => p.id === selectedPresetId)) {
        const firstPreset = presets[0];
        setSelectedPresetId(firstPreset.id);
        if (onOpenSite) {
          onOpenSite(firstPreset.url);
        }
      }
    } else {
      setSelectedPresetId(null);
    }
  }, [presets, selectedPresetId, onOpenSite]);

  const activePreset = presets.find((p) => p.id === selectedPresetId) || null;

  const handleSelectPreset = (preset: PresetItem) => {
    setSelectedPresetId(preset.id);
    setLoading(true);
    setShowBlockedHelper(false);

    if (onOpenSite) {
      onOpenSite(preset.url);
    }

    if (!useProxy) {
      setTimeout(() => {
        setShowBlockedHelper(true);
      }, 3500);
    }
  };

  const handleReload = () => {
    if (activePreset) {
      setLoading(true);
      const currentId = selectedPresetId;
      setSelectedPresetId(null);
      setTimeout(() => {
        setSelectedPresetId(currentId);
      }, 50);
    }
  };

  const getIframeSrc = (): string => {
    if (!activePreset) return '';
    if (useProxy) {
      return `/api/proxy?url=${encodeURIComponent(activePreset.url)}`;
    }
    return activePreset.url;
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-slate-800/60 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-slate-100">Website Viewer</h2>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Links Only</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              View-only mode: Only approved links added by Admin are displayed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activePreset && (
            <>
              <button
                onClick={handleReload}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                title="Reload Website"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <a
                href={activePreset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                title="Open in New Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Admin Links Selection Bar (View Only - No custom URL inputs) */}
      <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Select Admin Added Website:</span>
            <span className="text-[11px] font-mono text-slate-500">
              ({presets.length} available)
            </span>
          </div>

          {/* Smart Proxy Toggle */}
          <button
            onClick={() => {
              setUseProxy(!useProxy);
              if (activePreset) {
                setLoading(true);
              }
            }}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all ${
              useProxy
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Smart Bypass strips X-Frame-Options & CSP headers"
          >
            <Sparkles className="w-3 h-3" />
            <span>Smart Bypass: {useProxy ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Admin Links Chips/Tabs */}
        {presets && presets.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 max-h-24 overflow-y-auto">
            {presets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                  }`}
                  title={preset.description || preset.url}
                >
                  <Globe className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                  <span className="font-semibold">{preset.title}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-amber-400/90 flex items-center justify-between">
            <span>No website links have been added by the admin yet.</span>
            <a
              href="/login"
              className="text-blue-400 hover:text-blue-300 underline font-medium ml-2"
            >
              Sign in as Admin to add links →
            </a>
          </div>
        )}
      </div>

      {/* Browser Mockup Chrome Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        </div>

        <div className="flex-1 max-w-md bg-slate-900 border border-slate-800 rounded px-2.5 py-0.5 flex items-center gap-1.5 text-[11px] font-mono text-slate-400 truncate">
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-semibold truncate mr-1">
            {activePreset ? activePreset.title : 'No site selected'}:
          </span>
          <span className="truncate text-slate-500">
            {activePreset ? activePreset.url : 'about:blank'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {useProxy ? 'Smart Bypass Active' : 'Direct Embed'}
          </span>
        </div>
      </div>

      {/* Website Viewport */}
      <div className="flex-1 min-h-[380px] bg-slate-950 flex flex-col relative">
        {loading && (
          <div className="h-0.5 w-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-blue-500 animate-[pulse_1s_infinite] w-2/3" />
          </div>
        )}

        {activePreset ? (
          <div className="relative w-full h-full min-h-[380px] flex flex-col flex-1">
            <iframe
              key={activePreset.id + (useProxy ? '-proxy' : '-direct')}
              src={getIframeSrc()}
              title={activePreset.title}
              className="w-full flex-1 min-h-[380px] bg-white border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals"
              onLoad={() => setLoading(false)}
            />

            {/* Helper banner if frame is blocked */}
            {showBlockedHelper && (
              <div className="bg-slate-900 border-t border-slate-800 p-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Website restricting standard embed?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setUseProxy(true);
                      setShowBlockedHelper(false);
                      handleReload();
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium px-2 py-1 rounded transition-colors"
                  >
                    Enable Smart Bypass
                  </button>
                  <a
                    href={activePreset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2 py-1 rounded transition-colors"
                  >
                    Open New Tab ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="m-auto text-center p-8 max-w-sm space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-blue-400">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No Admin Link Available</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This panel is in <strong>View-Only</strong> mode and only displays links configured and approved by the Admin.
            </p>
            <div className="pt-2">
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>Sign in as Admin to Add Links</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Pill */}
      {activePreset && (
        <div className="bg-slate-950/80 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-slate-300">{activePreset.title}:</span>
            <span className="text-slate-500 truncate">{activePreset.description || activePreset.url}</span>
          </div>
          <span className="text-[10px] uppercase font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">
            ✓ Admin Approved Link
          </span>
        </div>
      )}
    </section>
  );
}
