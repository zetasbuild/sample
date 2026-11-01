'use client';

import React, { useState } from 'react';
import { RotateCw, ShieldCheck } from 'lucide-react';
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
    embedUrl = `https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`;
    if (parsed.startTime > 0) {
      embedUrl += `&start=${parsed.startTime}`;
    }
  }

  const handleReload = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            <YouTubeIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">YouTube Player</h2>
              <span className="text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Stream</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Playing active media stream configured by Admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeUrl && (
            <button
              onClick={handleReload}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
              title="Reload Video"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport */}
      <div className="flex-1 min-h-[440px] bg-black flex flex-col relative">
        {embedUrl ? (
          <div className="relative w-full h-full min-h-[440px] flex flex-1">
            <iframe
              key={`${parsed?.videoId}-${refreshKey}`}
              src={embedUrl}
              title="Admin YouTube Video Player"
              className="w-full flex-1 min-h-[440px] border-0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="m-auto text-center p-8 max-w-sm space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-red-600">
              <YouTubeIcon className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Video Configured</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No active media stream has been set by the admin yet.
            </p>
          </div>
        )}
      </div>

      {/* Clean Footer - Zero exposed URLs */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Live Video Player</span>
        </div>
        <span className="text-[10px] uppercase font-mono font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shrink-0">
          ✓ Verified Admin Stream
        </span>
      </div>
    </section>
  );
}
