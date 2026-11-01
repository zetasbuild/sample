'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCw,
  ShieldCheck,
  Tv
} from 'lucide-react';
import { YouTubeIcon } from './Icons';
import { PresetItem } from '@/types';

// Declare YT global interface for TypeScript
declare global {
  interface Window {
    YT: {
      Player: new (
        element: HTMLElement | string,
        config: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

interface YouTubePanelProps {
  videoUrl?: string;
  presets?: PresetItem[];
}

export function parseYouTubeUrl(rawUrl: string): { videoId: string; startTime: number } | null {
  if (!rawUrl) return null;
  let urlString = rawUrl.trim();

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

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${formattedMins}:${formattedSecs}`;
}

export default function YouTubePanel({ videoUrl, presets }: YouTubePanelProps) {
  const activeUrl = videoUrl || (presets && presets.length > 0 ? presets[0].url : '');
  const parsed = parseYouTubeUrl(activeUrl);
  const videoId = parsed?.videoId || null;

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls when playing and inactive
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Load YouTube IFrame API script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT || !window.YT.Player) {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }
    }
  }, []);

  // Initialize YT.Player
  useEffect(() => {
    if (!videoId) return;

    let destroyed = false;
    let progressInterval: NodeJS.Timeout | null = null;

    const setupPlayer = () => {
      if (destroyed || !iframeHostRef.current || !window.YT || !window.YT.Player) return;

      try {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        // Host element inside ref
        iframeHostRef.current.innerHTML = '';
        const mountDiv = document.createElement('div');
        mountDiv.className = 'w-full h-full';
        iframeHostRef.current.appendChild(mountDiv);

        playerRef.current = new window.YT.Player(mountDiv, {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0, // Hides native YouTube controls completely
            modestbranding: 1, // Minimizes YouTube branding
            rel: 0, // No related videos from external channels
            disablekb: 1, // Disables keyboard shortcuts so user can't trigger YouTube menus
            fs: 0, // Hides native fullscreen button which links to YouTube
            iv_load_policy: 3, // No video annotations
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined
          },
          events: {
            onReady: (event) => {
              if (destroyed) return;
              setIsReady(true);
              const p = event.target;
              p.setVolume(80);
              setVolume(80);
              const d = p.getDuration();
              if (d > 0) setDuration(d);
              p.playVideo();
            },
            onStateChange: (event) => {
              if (destroyed) return;
              const state = event.data;
              if (state === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setIsBuffering(false);
                if (playerRef.current) {
                  const d = playerRef.current.getDuration();
                  if (d > 0) setDuration(d);
                }
              } else if (state === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                setIsBuffering(false);
                setShowControls(true);
              } else if (state === window.YT.PlayerState.BUFFERING) {
                setIsBuffering(true);
              } else if (state === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                setIsBuffering(false);
                setShowControls(true);
              }
            }
          }
        });

        // Track playback progress
        progressInterval = setInterval(() => {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            try {
              const cur = playerRef.current.getCurrentTime();
              setCurrentTime(cur);
              const dur = playerRef.current.getDuration();
              if (dur > 0 && dur !== duration) setDuration(dur);
            } catch {
              // Ignore transient cross-frame errors
            }
          }
        }, 300);
      } catch (err) {
        console.error('Failed to initialize YouTube Player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        setupPlayer();
      };
    }

    return () => {
      destroyed = true;
      if (progressInterval) clearInterval(progressInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Handle Play / Pause Toggle
  const togglePlay = () => {
    if (!playerRef.current) return;
    resetControlsTimer();
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  // Handle Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, true);
    }
    resetControlsTimer();
  };

  // Handle Mute / Unmute
  const toggleMute = () => {
    if (!playerRef.current) return;
    resetControlsTimer();
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 80);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  // Handle Volume Slider
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (playerRef.current) {
      playerRef.current.setVolume(val);
      if (val === 0) {
        playerRef.current.mute();
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
    resetControlsTimer();
  };

  // Handle Fullscreen Toggle
  const toggleFullscreen = async () => {
    if (!playerContainerRef.current) return;
    resetControlsTimer();

    try {
      if (!document.fullscreenElement) {
        await playerContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Listen to native fullscreen exit (e.g. Esc key)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Reload current stream
  const handleReload = () => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
    } else {
      window.location.reload();
    }
  };

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl flex flex-col overflow-hidden shadow-sm select-none">
      {/* Header */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-3 sm:px-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            <YouTubeIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Featured Video</h2>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Protected Player</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Active media stream configured by Admin
            </p>
          </div>
        </div>

        <button
          onClick={handleReload}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          title="Reload Video"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Video Viewport Container */}
      <div
        ref={playerContainerRef}
        onMouseMove={resetControlsTimer}
        onMouseEnter={() => setShowControls(true)}
        onContextMenu={(e) => e.preventDefault()} // Disables right-click context menu
        className="relative w-full aspect-video bg-black overflow-hidden flex flex-col items-center justify-center group"
      >
        {videoId ? (
          <>
            {/* YouTube Iframe Host with pointer-events: none */}
            {/* The scale-105 pushes any remaining edge watermarks off-screen */}
            <div
              ref={iframeHostRef}
              className="absolute inset-0 w-full h-full pointer-events-none scale-[1.04] origin-center"
            />

            {/* Click-to-Play/Pause Transparent Overlay */}
            {/* Captures all clicks so user cannot click into the iframe or copy any link */}
            <div
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
              className="absolute inset-0 z-10 cursor-pointer"
              title={isPlaying ? 'Click to pause' : 'Click to play'}
            />

            {/* Center Play Button Overlay when paused */}
            {!isPlaying && isReady && (
              <button
                onClick={togglePlay}
                className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 cursor-pointer pointer-events-auto"
                aria-label="Play"
              >
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
              </button>
            )}

            {/* Buffering Indicator */}
            {isBuffering && (
              <div className="absolute z-20 pointer-events-none flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Buffering...</span>
              </div>
            )}

            {/* Custom Control Bar - Clean Light/White Theme Overlay */}
            {/* Sits at the bottom and physically covers where "Watch on YouTube" sits */}
            <div
              className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 pointer-events-auto ${
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-2 sm:px-4 sm:py-2.5 shadow-lg space-y-2">
                {/* Seek Progress Bar */}
                <div className="relative flex items-center group/scrubber cursor-pointer">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
                  />
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between gap-3 text-slate-800">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="p-1.5 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current" />
                      )}
                    </button>

                    {/* Mute / Volume */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={toggleMute}
                        className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-slate-700" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 sm:w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600 hidden sm:block"
                        title="Volume"
                      />
                    </div>

                    {/* Current / Total Duration */}
                    <span className="text-xs font-mono font-medium text-slate-600">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Protected stream indicator */}
                    <span className="text-[10px] uppercase font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full hidden sm:inline-block">
                      Protected Stream
                    </span>

                    {/* Fullscreen Toggle */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4" />
                      ) : (
                        <Maximize className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-8 max-w-sm space-y-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-2xs">
              <Tv className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Video Configured Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The administrator has not added any video yet. Please check back later or add one via the Admin Panel.
            </p>
          </div>
        )}
      </div>

      {/* Clean Footer - Light Theme */}
      <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-2.5 sm:px-5 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${videoId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="font-semibold text-slate-700">
            {videoId ? 'Live Video Stream' : 'Awaiting Video Stream'}
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {videoId ? 'Link Copying Disabled' : 'No Active Video'}
        </span>
      </div>
    </section>
  );
}
