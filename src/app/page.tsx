'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import YouTubePanel from '@/components/YouTubePanel';
import WebsitePanel from '@/components/WebsitePanel';
import { PresetItem } from '@/types';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<'split' | 'youtube' | 'website'>('split');
  const [orientation, setOrientation] = useState<'columns' | 'rows'>('columns');
  const [webPresets, setWebPresets] = useState<PresetItem[]>([]);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('https://youtu.be/TtJILk3vXnc');
  const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);

  // Fetch initial video, presets, and auth status
  useEffect(() => {
    async function loadData() {
      try {
        const [videoRes, presetsRes, authRes] = await Promise.all([
          fetch('/api/video'),
          fetch('/api/presets'),
          fetch('/api/auth/me')
        ]);

        if (videoRes.ok) {
          const vData = await videoRes.json();
          if (vData.url) {
            setActiveVideoUrl(vData.url);
          }
        }

        if (presetsRes.ok) {
          const data = await presetsRes.json();
          if (data.presets) {
            setWebPresets(data.presets.filter((p: PresetItem) => p.type === 'website'));
          }
        }

        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.user) {
            setAdminUser(authData.user);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }

    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAdminUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const logActivity = async (url: string, type: 'youtube' | 'website') => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type })
      });
    } catch {
      // Ignore background log error
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        orientation={orientation}
        setOrientation={setOrientation}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-3 sm:p-5 max-w-[1920px] mx-auto w-full flex flex-col">
        {viewMode === 'split' ? (
          <div
            className={`grid gap-4 flex-1 ${
              orientation === 'columns'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            <YouTubePanel
              videoUrl={activeVideoUrl}
              onPlayVideo={(url) => logActivity(url, 'youtube')}
            />
            <WebsitePanel
              presets={webPresets}
              onOpenSite={(url) => logActivity(url, 'website')}
            />
          </div>
        ) : viewMode === 'youtube' ? (
          <div className="flex-1 flex flex-col">
            <YouTubePanel
              videoUrl={activeVideoUrl}
              onPlayVideo={(url) => logActivity(url, 'youtube')}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <WebsitePanel
              presets={webPresets}
              onOpenSite={(url) => logActivity(url, 'website')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
