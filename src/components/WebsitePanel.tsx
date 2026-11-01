'use client';

import React, { useState } from 'react';
import { 
  Globe, 
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
    <section className="bg-white border border-slate-200/90 rounded-2xl flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Website Viewer</h2>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Link Only</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Only displaying the active website link set by Admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeUrl && (
            <button
              onClick={handleReload}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
              title="Reload Website"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Browser Mockup Chrome Bar - Light Theme */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>

        <div className="flex-1 max-w-md bg-white border border-slate-200 rounded px-2.5 py-0.5 flex items-center gap-1.5 text-[11px] font-mono text-slate-700 shadow-2xs truncate">
          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate">
            {activeUrl || 'about:blank'}
          </span>
        </div>

        <div>
          <button
            onClick={() => setUseProxy(!useProxy)}
            className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
            title="Click to toggle Smart Bypass"
          >
            {useProxy ? 'Smart Bypass Active' : 'Direct Embed'}
          </button>
        </div>
      </div>

      {/* Website Viewport (Direct iframe without clutter) */}
      <div className="flex-1 min-h-[440px] bg-slate-50 flex flex-col relative">
        {loading && (
          <div className="h-0.5 w-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-blue-600 animate-[pulse_1s_infinite] w-2/3" />
          </div>
        )}

        {activeUrl ? (
          <div className="relative w-full h-full min-h-[440px] flex flex-col flex-1">
            <iframe
              key={`${activeUrl}-${refreshKey}-${useProxy ? 'proxy' : 'direct'}`}
              src={getIframeSrc()}
              title="Admin Website View"
              className="w-full flex-1 min-h-[440px] bg-white border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals"
              onLoad={() => setLoading(false)}
            />

            {/* Helper banner if frame is blocked in direct mode */}
            {showBlockedHelper && !useProxy && (
              <div className="bg-amber-50 border-t border-amber-200 p-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Website restricting standard embed?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setUseProxy(true);
                      setShowBlockedHelper(false);
                      handleReload();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-2 py-1 rounded transition-colors cursor-pointer"
                  >
                    Enable Smart Bypass
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="m-auto text-center p-8 max-w-sm space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Website Configured</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The admin has not pasted an active website link yet.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info Pill */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Live Website Frame</span>
        </div>
        <span className="text-[10px] uppercase font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
          ✓ Verified Admin Stream
        </span>
      </div>
    </section>
  );
}
