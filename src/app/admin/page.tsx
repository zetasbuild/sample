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
  Play,
  Globe,
  Save
} from 'lucide-react';
import { YouTubeIcon } from '@/components/Icons';
import { parseYouTubeUrl } from '@/components/YouTubePanel';
import { normalizeWebUrl } from '@/components/WebsitePanel';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminUsername, setAdminUsername] = useState<string>('admin');

  // YouTube Video link state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeVideo, setActiveVideo] = useState('https://youtu.be/TtJILk3vXnc');
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoMsg, setVideoMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Website link state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [activeWebsite, setActiveWebsite] = useState('https://en.wikipedia.org');
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [websiteMsg, setWebsiteMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Verify auth and load current links on mount
  useEffect(() => {
    async function init() {
      try {
        const [authRes, videoRes, webRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/video'),
          fetch('/api/website')
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

        if (webRes.ok) {
          const webData = await webRes.json();
          if (webData.url) {
            setActiveWebsite(webData.url);
            setWebsiteUrl(webData.url);
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

  // Paste handlers
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

  const handlePasteWebsite = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setWebsiteUrl(text.trim());
        setWebsiteMsg(null);
      }
    } catch {
      setWebsiteMsg({ text: 'Clipboard permission denied. Please press Cmd+V.', type: 'error' });
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

  // Save Website link
  const handleSaveWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) {
      setWebsiteMsg({ text: 'Please enter or paste a website URL', type: 'error' });
      return;
    }

    const normalized = normalizeWebUrl(websiteUrl);
    setSavingWebsite(true);
    setWebsiteMsg(null);

    try {
      const res = await fetch('/api/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveWebsite(normalized);
        setWebsiteMsg({ text: 'Website link updated successfully!', type: 'success' });
      } else {
        setWebsiteMsg({ text: data.message || 'Failed to update website', type: 'error' });
      }
    } catch {
      setWebsiteMsg({ text: 'Connection error while saving', type: 'error' });
    } finally {
      setSavingWebsite(false);
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
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
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
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">DualView Admin Panel</h1>
                <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                  {adminUsername}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paste the YouTube link &amp; Website link to update the main public panels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>View Live Panel</span>
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

      {/* Main Container: Two Focused Cards for YouTube Link & Website Link */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ================= CARD 1: YOUTUBE LINK ================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                <YouTubeIcon className="w-3.5 h-3.5" />
                <span>YouTube Video Link</span>
              </div>
              <h2 className="text-base font-bold text-white">Paste YouTube Link</h2>
              <p className="text-xs text-slate-400">
                This exact video will play on the left panel of the main page.
              </p>
            </div>

            {videoMsg && (
              <div
                className={`text-xs p-3 rounded-lg flex items-center gap-2 ${
                  videoMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {videoMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <span>⚠️</span>}
                <span>{videoMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveVideo} className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 focus-within:border-red-500 transition-all">
                <span className="pl-2 text-slate-500 text-xs">🔗</span>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    setVideoMsg(null);
                  }}
                  placeholder="https://youtu.be/... or watch?v=..."
                  required
                  className="flex-1 bg-transparent text-xs font-mono text-slate-200 outline-none placeholder:text-slate-600 px-2"
                />
                <button
                  type="button"
                  onClick={handlePasteVideo}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>Paste</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={savingVideo}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                {savingVideo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Video...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Save YouTube Link</span>
                  </>
                )}
              </button>
            </form>

            {/* Video Preview */}
            <div className="border-t border-slate-800/80 pt-3 flex-1 flex flex-col justify-end">
              <div className="text-[11px] text-slate-400 font-mono truncate mb-2">
                Active: <span className="text-red-400">{activeVideo}</span>
              </div>
              {embedUrl && (
                <div className="w-full rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video">
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

          {/* ================= CARD 2: WEBSITE LINK ================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                <Globe className="w-3.5 h-3.5" />
                <span>Website Link</span>
              </div>
              <h2 className="text-base font-bold text-white">Paste Website Link</h2>
              <p className="text-xs text-slate-400">
                This exact website will be displayed on the right panel of the main page.
              </p>
            </div>

            {websiteMsg && (
              <div
                className={`text-xs p-3 rounded-lg flex items-center gap-2 ${
                  websiteMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {websiteMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <span>⚠️</span>}
                <span>{websiteMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveWebsite} className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 focus-within:border-blue-500 transition-all">
                <span className="pl-2 text-slate-500 text-xs">🌐</span>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => {
                    setWebsiteUrl(e.target.value);
                    setWebsiteMsg(null);
                  }}
                  placeholder="https://en.wikipedia.org or any URL..."
                  required
                  className="flex-1 bg-transparent text-xs font-mono text-slate-200 outline-none placeholder:text-slate-600 px-2"
                />
                <button
                  type="button"
                  onClick={handlePasteWebsite}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>Paste</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={savingWebsite}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                {savingWebsite ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Website...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Website Link</span>
                  </>
                )}
              </button>
            </form>

            {/* Website Preview */}
            <div className="border-t border-slate-800/80 pt-3 flex-1 flex flex-col justify-end">
              <div className="text-[11px] text-slate-400 font-mono truncate mb-2">
                Active: <span className="text-blue-400">{activeWebsite}</span>
              </div>
              <div className="w-full rounded-lg overflow-hidden border border-slate-800 bg-white aspect-video">
                <iframe
                  src={`/api/proxy?url=${encodeURIComponent(activeWebsite)}`}
                  title="Active Website Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
