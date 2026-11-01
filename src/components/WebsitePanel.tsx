'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  RotateCw, 
  Lock, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

interface WebsitePanelProps {
  websiteUrl?: string;
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

export default function WebsitePanel({ websiteUrl }: WebsitePanelProps) {
  const [useProxy, setUseProxy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showBlockedHelper, setShowBlockedHelper] = useState(false);

  const activeUrl = websiteUrl ? normalizeWebUrl(websiteUrl) : 'https://en.wikipedia.org';

  const handleReload = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
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
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-slate-100">Website Viewer</h2>
              <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Link Only</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Only displaying the active website link set by Admin
            </p>
          </div>
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
            </>
          )}
        </div>
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
          <span className="truncate text-slate-300">
            {activeUrl || 'about:blank'}
          </span>
        </div>

        <div>
          <button
            onClick={() => setUseProxy(!useProxy)}
            className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded-full transition-colors"
            title="Click to toggle Smart Bypass"
          >
            {useProxy ? 'Smart Bypass Active' : 'Direct Embed'}
          </button>
        </div>
      </div>

      {/* Website Viewport (Direct iframe without clutter) */}
      <div className="flex-1 min-h-[420px] bg-slate-950 flex flex-col relative">
        {loading && (
          <div className="h-0.5 w-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-blue-500 animate-[pulse_1s_infinite] w-2/3" />
          </div>
        )}

        {activeUrl ? (
          <div className="relative w-full h-full min-h-[420px] flex flex-col flex-1">
            <iframe
              key={`${activeUrl}-${refreshKey}-${useProxy ? 'proxy' : 'direct'}`}
              src={getIframeSrc()}
              title="Admin Website View"
              className="w-full flex-1 min-h-[420px] bg-white border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals"
              onLoad={() => setLoading(false)}
            />

            {/* Helper banner if frame is blocked in direct mode */}
            {showBlockedHelper && !useProxy && (
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
            <h3 className="text-sm font-semibold text-slate-200">No Website Configured</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The admin has not pasted an active website link yet.
            </p>
            <div className="pt-2">
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>Sign in to Admin Panel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Pill */}
      {activeUrl && (
        <div className="bg-slate-950/80 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-slate-300">Active Site:</span>
            <span className="font-mono text-slate-500 truncate">{activeUrl}</span>
          </div>
          <span className="text-[10px] uppercase font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded shrink-0">
            ✓ Admin Set Website
          </span>
        </div>
      )}
    </section>
  );
}
