'use client';

import React, { useState } from 'react';
import { Clipboard, Play, X, Clock } from 'lucide-react';
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
  const [urlInput, setUrlInput] = useState('');
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);

  const handleLoadVideo = (targetUrl?: string) => {
    const urlToLoad = targetUrl || urlInput;
    if (!urlToLoad.trim()) {
      setErrorMsg('Please paste a YouTube link');
      return;
    }

    const parsed = parseYouTubeUrl(urlToLoad);
    if (!parsed) {
      setErrorMsg('Invalid YouTube URL. Check watch?v=, youtu.be, or shorts.');
      return;
    }

    setErrorMsg(null);
    let embed = `https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=1&rel=0`;
    if (parsed.startTime > 0) {
      embed += `&start=${parsed.startTime}`;
    }

    setActiveVideoId(parsed.videoId);
    setActiveEmbedUrl(embed);

    // Update history
    setRecentUrls((prev) => {
      const filtered = prev.filter((u) => u !== urlToLoad);
      return [urlToLoad, ...filtered].slice(0, 5);
    });

    if (onPlayVideo) {
      onPlayVideo(urlToLoad);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
        handleLoadVideo(text);
      }
    } catch {
      setErrorMsg('Clipboard permission not granted. Use Cmd+V.');
    }
  };

  const handleClear = () => {
    setActiveEmbedUrl(null);
    setActiveVideoId(null);
    setUrlInput('');
    setErrorMsg(null);
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-slate-800/60 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <YouTubeIcon className="w-5 h-5 text-red-500" />
          <h2 className="text-sm font-semibold text-slate-100">YouTube Player</h2>
        </div>
        <div className="flex items-center gap-2">
          {activeVideoId ? (
            <span className="text-[11px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
              ID: {activeVideoId}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              Idle
            </span>
          )}
          {activeEmbedUrl && (
            <button
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* URL Input Bar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1.5 focus-within:border-blue-500 transition-colors">
          <span className="pl-2 text-slate-500 text-xs">🔗</span>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setErrorMsg(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
            placeholder="Paste YouTube link (watch?v=..., youtu.be/..., shorts/...)"
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
            onClick={() => handleLoadVideo()}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium px-3.5 py-1.5 rounded shadow-sm hover:shadow-red-500/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play</span>
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
            {errorMsg}
          </p>
        )}

        {/* Preset Chips */}
        {presets && presets.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Presets:</span>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setUrlInput(preset.url);
                  handleLoadVideo(preset.url);
                }}
                className="text-[11px] bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white px-2 py-0.5 rounded-full transition-colors"
                title={preset.description || preset.url}
              >
                {preset.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video Viewport */}
      <div className="flex-1 min-h-[380px] bg-black flex flex-col relative">
        {activeEmbedUrl ? (
          <div className="relative w-full h-full min-h-[380px] flex">
            <iframe
              src={activeEmbedUrl}
              title="YouTube video player"
              className="w-full h-full min-h-[380px] border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="m-auto text-center p-8 max-w-sm space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-red-500">
              <YouTubeIcon className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No Video Loaded</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Copy any YouTube link from your browser and click <strong>Paste &amp; Play</strong> above.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded">
                ✓ watch?v=
              </span>
              <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded">
                ✓ youtu.be
              </span>
              <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded">
                ✓ shorts/
              </span>
              <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded">
                ✓ timestamps ?t=
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
                  handleLoadVideo(url);
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
