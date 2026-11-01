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

  // Single field for YouTube link
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeVideo, setActiveVideo] = useState('https://youtu.be/TtJILk3vXnc');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Verify auth and load current active video on mount
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setYoutubeUrl(text.trim());
        setMessage(null);
      }
    } catch {
      setMessage({ text: 'Clipboard permission denied. Please press Cmd+V to paste.', type: 'error' });
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      setMessage({ text: 'Please enter or paste a YouTube URL', type: 'error' });
      return;
    }

    const parsed = parseYouTubeUrl(youtubeUrl);
    if (!parsed) {
      setMessage({ text: 'Invalid YouTube URL. Please check the link format.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveVideo(youtubeUrl.trim());
        setMessage({ text: 'Active YouTube video updated successfully!', type: 'success' });
      } else {
        setMessage({ text: data.message || 'Failed to update video', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Connection error while saving', type: 'error' });
    } finally {
      setSaving(false);
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
        <span>Loading Admin Panel...</span>
      </div>
    );
  }

  const parsedActive = parseYouTubeUrl(activeVideo);
  const embedUrl = parsedActive
    ? `https://www.youtube-nocookie.com/embed/${parsedActive.videoId}?autoplay=0&rel=0`
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">DualView Admin Panel</h1>
                <span className="text-[11px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">
                  {adminUsername}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Single video manager: Paste YouTube link to update public player
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>View Dual Panel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Single Field Form Card */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-semibold">
              <YouTubeIcon className="w-3.5 h-3.5" />
              <span>YouTube Video Manager</span>
            </div>
            <h2 className="text-lg font-bold text-white">Paste YouTube Link</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Paste any YouTube video or shorts link below. This single video will be displayed in the player on the main page.
            </p>
          </div>

          {/* Feedback Alert */}
          {message && (
            <div
              className={`text-xs p-3.5 rounded-lg flex items-center gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <span>⚠️</span>
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Single Field Form */}
          <form onSubmit={handleSaveVideo} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                YouTube URL
              </label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/50 transition-all">
                <span className="pl-2 text-slate-500 text-sm">🔗</span>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    setMessage(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  required
                  className="flex-1 bg-transparent text-xs sm:text-sm font-mono text-slate-200 outline-none placeholder:text-slate-600 px-2"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors shrink-0"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving YouTube Video...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Save Video Link</span>
                </>
              )}
            </button>
          </form>

          {/* Active Video Live Preview Box */}
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Currently Active Video:</span>
              <a
                href={activeVideo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 font-mono flex items-center gap-1 truncate max-w-xs"
              >
                <span className="truncate">{activeVideo}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            {embedUrl && (
              <div className="w-full rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video max-h-[300px]">
                <iframe
                  src={embedUrl}
                  title="Active YouTube Video Preview"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
