'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  Clipboard, 
  ExternalLink, 
  RotateCw, 
  Lock, 
  Sparkles, 
  Clock, 
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
  const [urlInput, setUrlInput] = useState('');
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [showBlockedHelper, setShowBlockedHelper] = useState(false);

  const handleOpenSite = (targetUrl?: string) => {
    const raw = targetUrl || urlInput;
    const normalized = normalizeWebUrl(raw);

    if (!normalized) {
      setErrorMsg('Please enter a website URL');
      return;
    }

    try {
      new URL(normalized);
    } catch {
      setErrorMsg('Invalid URL format');
      return;
    }

    setErrorMsg(null);
    setShowBlockedHelper(false);
    setActiveUrl(normalized);
    setLoading(true);

    setRecentUrls((prev) => {
      const filtered = prev.filter((u) => u !== normalized);
      return [normalized, ...filtered].slice(0, 5);
    });

    if (onOpenSite) {
      onOpenSite(normalized);
    }

    // If direct mode is selected, show helper if site blocks framing
    if (!useProxy) {
      setTimeout(() => {
        setShowBlockedHelper(true);
      }, 3000);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
        handleOpenSite(text);
      }
    } catch {
      setErrorMsg('Clipboard permission not granted. Use Cmd+V.');
    }
  };

  const handleClear = () => {
    setActiveUrl(null);
    setUrlInput('');
    setErrorMsg(null);
    setShowBlockedHelper(false);
    setLoading(false);
  };

  const handleReload = () => {
    if (activeUrl) {
      setLoading(true);
      const current = activeUrl;
      setActiveUrl(null);
      setTimeout(() => {
        setActiveUrl(current);
      }, 50);
    }
  };

  const getIframeSrc = (): string => {
    if (!activeUrl) return '';
    if (useProxy) {
      return `/api/proxy?url=${encodeURIComponent(activeUrl)}`;
    }
    return activeUrl;
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-slate-800/60 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-100">Website Viewer</h2>
        </div>

        <div className="flex items-center gap-1.5">
          {activeUrl && (
            <>
              <button
                onClick={handleReload}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                title="Reload Website"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                title="Open in New Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={handleClear}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* URL Input Bar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1.5 focus-within:border-blue-500 transition-colors">
          <span className="pl-2 text-slate-500 text-xs">🌐</span>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setErrorMsg(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleOpenSite()}
            placeholder="Paste website URL (e.g., wikipedia.org, github.com, mdn.io)"
            className="flex-1 bg-transparent text-xs sm:text-sm font-mono text-slate-200 outline-none placeholder:text-slate-500 placeholder:font-sans px-2"
          />
          <button
            onClick={handlePaste}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded transition-colors"
            title="Paste from clipboard"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paste</span>
          </button>
          <button
            onClick={() => handleOpenSite()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-1.5 rounded shadow-sm hover:shadow-blue-500/20 transition-all"
          >
            <span>Open</span>
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
            {errorMsg}
          </p>
        )}

        {/* Preset Chips & Bypass Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          {presets && presets.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-medium text-slate-500 mr-1">Presets:</span>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setUrlInput(preset.url);
                    handleOpenSite(preset.url);
                  }}
                  className="text-[11px] bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white px-2 py-0.5 rounded-full transition-colors"
                  title={preset.description || preset.url}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          )}

          {/* Smart Proxy Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUseProxy(!useProxy);
                if (activeUrl) {
                  setLoading(true);
                }
              }}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border transition-all ${
                useProxy
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Bypasses X-Frame-Options and CSP headers so any site can be embedded"
            >
              <Sparkles className="w-3 h-3" />
              <span>Smart Bypass: {useProxy ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Browser Mockup Chrome Bar */}
      <div className="bg-slate-950 border-y border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        </div>

        <div className="flex-1 max-w-md bg-slate-900 border border-slate-800 rounded px-2.5 py-0.5 flex items-center gap-1.5 text-[11px] font-mono text-slate-400 truncate">
          <Lock className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{activeUrl || 'about:blank'}</span>
        </div>

        <div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              useProxy
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}
          >
            {useProxy ? 'Bypass' : 'Direct'}
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

        {activeUrl ? (
          <div className="relative w-full h-full min-h-[380px] flex flex-col flex-1">
            <iframe
              src={getIframeSrc()}
              title="Embedded Website"
              className="w-full flex-1 min-h-[380px] bg-white border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals"
              onLoad={() => setLoading(false)}
            />

            {/* Helper banner if frame is blocked */}
            {showBlockedHelper && (
              <div className="bg-slate-900 border-t border-slate-800 p-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Website blocking iframe embedding?</span>
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
                    href={activeUrl}
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
            <h3 className="text-sm font-semibold text-slate-200">No Website Loaded</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Copy and paste any web URL above and click <strong>Open</strong> to view it live.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded">
                ⚡ Smart Bypass Enabled
              </span>
              <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded">
                ✓ Auto https://
              </span>
              <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded">
                ✓ Secure Sandbox
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recent History */}
      {recentUrls.length > 0 && (
        <div className="bg-slate-950/80 border-t border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider shrink-0">
            Recent:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {recentUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setUrlInput(url);
                  handleOpenSite(url);
                }}
                className="text-[11px] font-mono text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded truncate max-w-[140px] transition-colors"
                title={url}
              >
                {url}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

