'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  LogOut,
  ExternalLink,
  Clipboard,
  CheckCircle2,
  Loader2,
  Play
} from 'lucide-react';
import { YouTubeIcon } from '@/components/Icons';
import { parseYouTubeUrl } from '@/components/YouTubePanel';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminUsername, setAdminUsername] = useState<string>('admin');

  // YouTube Video link state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeVideo, setActiveVideo] = useState('https://youtu.be/TtJILk3vXnc');
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoMsg, setVideoMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Verify auth and load current video link on mount
  useEffect(() => {
    async function init() {
      try {
        const [authRes, videoRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/video')
        ]);

        const authData = await authRes.json();
        if (!authData.authenticated) {
          router.push('/login');
          return;
        }
        setAdminUsername(authData.user.username);

        if (videoRes.ok) {
          const videoData = await videoRes.json();
          if (videoData.url) {
            setActiveVideo(videoData.url);
            setYoutubeUrl(videoData.url);
          }
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  // Paste handler
  const handlePasteVideo = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setYoutubeUrl(text.trim());
        setVideoMsg(null);
      }
    } catch {
      setVideoMsg({ text: 'Clipboard permission denied. Please press Cmd+V.', type: 'error' });
    }
  };

  // Save YouTube Video link
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      setVideoMsg({ text: 'Please enter or paste a YouTube URL', type: 'error' });
      return;
    }

    const parsed = parseYouTubeUrl(youtubeUrl);
    if (!parsed) {
      setVideoMsg({ text: 'Invalid YouTube URL. Please check the link format.', type: 'error' });
      return;
    }

    setSavingVideo(true);
    setVideoMsg(null);

    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveVideo(youtubeUrl.trim());
        setVideoMsg({ text: 'YouTube video link updated successfully!', type: 'success' });
      } else {
        setVideoMsg({ text: data.message || 'Failed to update video', type: 'error' });
      }
    } catch {
      setVideoMsg({ text: 'Connection error while saving', type: 'error' });
    } finally {
      setSavingVideo(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-red-600" />
        <span className="font-medium text-sm">Loading Admin Panel...</span>
      </div>
    );
  }

  const parsedActive = parseYouTubeUrl(activeVideo);
  const embedUrl = parsedActive
    ? `https://www.youtube-nocookie.com/embed/${parsedActive.videoId}?autoplay=0&rel=0`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-50 backdrop-blur-md shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">Admin Panel</h1>
                <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  {adminUsername}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Update the active YouTube video displayed on the website
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>View Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Single Card: Paste YouTube Link */}
      <main className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full text-xs font-semibold">
              <YouTubeIcon className="w-3.5 h-3.5" />
              <span>YouTube Video Link</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Paste YouTube Link</h2>
            <p className="text-xs text-slate-500">
              Paste any YouTube video or shorts URL. It will immediately update the main website view.
            </p>
          </div>

          {videoMsg && (
            <div
              className={`text-xs p-3 rounded-xl flex items-center gap-2 ${
                videoMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {videoMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <span className="shrink-0">⚠️</span>
              )}
              <span>{videoMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveVideo} className="space-y-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2 focus-within:bg-white focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 transition-all">
              <span className="pl-2 text-slate-400 text-xs">🔗</span>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setVideoMsg(null);
                }}
                placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                required
                className="flex-1 bg-transparent text-xs font-mono text-slate-900 outline-none placeholder:text-slate-400 px-2"
              />
              <button
                type="button"
                onClick={handlePasteVideo}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={savingVideo}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              {savingVideo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Video...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Save YouTube Link</span>
                </>
              )}
            </button>
          </form>

          {/* Video Preview */}
          <div className="border-t border-slate-100 pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Active URL:</span>
              <span className="text-red-700 font-semibold truncate max-w-xs">{activeVideo}</span>
            </div>
            {embedUrl && (
              <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video shadow-2xs">
                <iframe
                  src={embedUrl}
                  title="Active Video Preview"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; encrypted-media"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
