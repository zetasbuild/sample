'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, RotateCw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { YouTubeIcon } from './Icons';
import { PresetItem } from '@/types';

interface YouTubePanelProps {
  presets: PresetItem[];
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

export default function YouTubePanel({ presets, onPlayVideo }: YouTubePanelProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-select first admin video link when presets load or change
  useEffect(() => {
    if (presets && presets.length > 0) {
      if (!selectedPresetId || !presets.some((p) => p.id === selectedPresetId)) {
        const firstPreset = presets[0];
        setSelectedPresetId(firstPreset.id);
        if (onPlayVideo) {
          onPlayVideo(firstPreset.url);
        }
      }
    } else {
      setSelectedPresetId(null);
    }
  }, [presets, selectedPresetId, onPlayVideo]);

  const activePreset = presets.find((p) => p.id === selectedPresetId) || null;

  const handleSelectPreset = (preset: PresetItem) => {
    setSelectedPresetId(preset.id);
    setRefreshKey((k) => k + 1);
    if (onPlayVideo) {
      onPlayVideo(preset.url);
    }
  };

  const handleReload = () => {
    setRefreshKey((k) => k + 1);
  };

  const getEmbedUrl = (): string | null => {
    if (!activePreset) return null;
    const parsed = parseYouTubeUrl(activePreset.url);
    if (!parsed) return null;

    let url = `https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=1&rel=0`;
    if (parsed.startTime > 0) {
      url += `&start=${parsed.startTime}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl();

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-slate-800/60 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <YouTubeIcon className="w-5 h-5 text-red-500" />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-slate-100">Video Player</h2>
              <span className="text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Videos Only</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              View-only mode: Only approved videos added by Admin are displayed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activePreset && (
            <>
              <button
                onClick={handleReload}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                title="Reload Video"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <a
                href={activePreset.url}
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

      {/* Admin Video Selector Bar (View Only - No input boxes) */}
      <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
            <span>Select Admin Added Video:</span>
            <span className="text-[11px] font-mono text-slate-500">
              ({presets.length} available)
            </span>
          </div>
        </div>

        {/* Video Selection Chips/Tabs */}
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
                      ? 'bg-red-600 text-white border-red-500 shadow-sm shadow-red-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                  }`}
                  title={preset.description || preset.url}
                >
                  <YouTubeIcon className="w-3.5 h-3.5" />
                  <span className="font-semibold">{preset.title}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-amber-400/90 flex items-center justify-between">
            <span>No videos have been added by the admin yet.</span>
            <a
              href="/login"
              className="text-red-400 hover:text-red-300 underline font-medium ml-2"
            >
              Sign in as Admin to add videos →
            </a>
          </div>
        )}
      </div>

      {/* Video Viewport (Direct embed without clutter) */}
      <div className="flex-1 min-h-[380px] bg-black flex flex-col relative">
        {embedUrl ? (
          <div className="relative w-full h-full min-h-[380px] flex flex-1">
            <iframe
              key={`${activePreset?.id}-${refreshKey}`}
              src={embedUrl}
              title={activePreset?.title || 'YouTube Video'}
              className="w-full flex-1 min-h-[380px] border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="m-auto text-center p-8 max-w-sm space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-red-500">
              <YouTubeIcon className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No Video Available</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This panel only displays videos added and approved in the Admin Control Panel.
            </p>
            <div className="pt-2">
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>Sign in as Admin to Add Videos</span>
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
          <span className="text-[10px] uppercase font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded shrink-0">
            ✓ Admin Approved Video
          </span>
        </div>
      )}
    </section>
  );
}
