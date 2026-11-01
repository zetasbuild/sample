'use client';

import React, { useState } from 'react';
import { ExternalLink, RotateCw, ShieldCheck } from 'lucide-react';
import { YouTubeIcon } from './Icons';
import { PresetItem } from '@/types';

interface YouTubePanelProps {
  videoUrl?: string;
  presets?: PresetItem[];
  onPlayVideo?: (url: string) => void;
}

export function parseYouTubeUrl(rawUrl: string): { videoId: string; startTime: number } | null {
  if (!rawUrl) return null;
  let urlString = rawUrl.trim();

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlString)) {
    return { videoId: urlString, startTime: 0 };
  }

  if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
    urlString = 'https://' + urlString;
  }

  try {
    const parsed = new URL(urlString);
    let videoId: string | null = null;
    let startTime = 0;

    const tParam = parsed.searchParams.get('t') || parsed.searchParams.get('start');
    if (tParam) {
      if (/^\d+$/.test(tParam)) {
        startTime = parseInt(tParam, 10);
      } else {
        const matchH = tParam.match(/(\d+)h/);
        const matchM = tParam.match(/(\d+)m/);
        const matchS = tParam.match(/(\d+)s/);
        let total = 0;
        if (matchH) total += parseInt(matchH[1], 10) * 3600;
        if (matchM) total += parseInt(matchM[1], 10) * 60;
        if (matchS) total += parseInt(matchS[1], 10);
        startTime = total;
      }
    }

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1).split('/')[0];
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.has('v')) {
        videoId = parsed.searchParams.get('v');
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.replace('/shorts/', '').split('/')[0];
      } else if (parsed.pathname.startsWith('/live/')) {
        videoId = parsed.pathname.replace('/live/', '').split('/')[0];
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.replace('/embed/', '').split('/')[0];
      }
    }

    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return { videoId, startTime };
    }
  } catch {
    // Malformed URL
  }

  return null;
}

export default function YouTubePanel({ videoUrl, presets }: YouTubePanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Active target video URL: prioritized from videoUrl prop or first preset
  const activeUrl = videoUrl || (presets && presets.length > 0 ? presets[0].url : 'https://youtu.be/TtJILk3vXnc');

  const parsed = parseYouTubeUrl(activeUrl);
  let embedUrl: string | null = null;
  if (parsed) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=1&rel=0`;
    if (parsed.startTime > 0) {
      embedUrl += `&start=${parsed.startTime}`;
    }
  }

  const handleReload = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-slate-800/60 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <YouTubeIcon className="w-5 h-5 text-red-500" />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-slate-100">YouTube Player</h2>
              <span className="text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Link Only</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Only displaying the active video link set by Admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeUrl && (
            <>
              <button
                onClick={handleReload}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                title="Reload Video"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                title="Open on YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Video Viewport (Direct Embed with zero extra clutter) */}
      <div className="flex-1 min-h-[420px] bg-black flex flex-col relative">
        {embedUrl ? (
          <div className="relative w-full h-full min-h-[420px] flex flex-1">
            <iframe
              key={`${parsed?.videoId}-${refreshKey}`}
              src={embedUrl}
              title="Admin YouTube Video"
              className="w-full flex-1 min-h-[420px] border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="m-auto text-center p-8 max-w-sm space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-red-500">
              <YouTubeIcon className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No Video Link Configured</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The admin has not pasted an active YouTube link yet.
            </p>
            <div className="pt-2">
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors"
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
            <span className="font-semibold text-slate-300">Active Video:</span>
            <span className="font-mono text-slate-500 truncate">{activeUrl}</span>
          </div>
          <span className="text-[10px] uppercase font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded shrink-0">
            ✓ Admin Set Video
          </span>
        </div>
      )}
    </section>
  );
}
