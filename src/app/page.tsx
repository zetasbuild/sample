'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import YouTubePanel from '@/components/YouTubePanel';
import WebsitePanel from '@/components/WebsitePanel';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<'split' | 'youtube' | 'website'>('split');
  const [orientation, setOrientation] = useState<'columns' | 'rows'>('columns');
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('https://youtu.be/TtJILk3vXnc');
  const [activeWebsiteUrl, setActiveWebsiteUrl] = useState<string>('https://en.wikipedia.org');
  const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);

  // Fetch initial video, website link, and auth status
  useEffect(() => {
    async function loadData() {
      try {
        const [videoRes, webRes, authRes] = await Promise.all([
          fetch('/api/video'),
          fetch('/api/website'),
          fetch('/api/auth/me')
        ]);

        if (videoRes.ok) {
          const vData = await videoRes.json();
          if (vData.url) {
            setActiveVideoUrl(vData.url);
          }
        }

        if (webRes.ok) {
          const wData = await webRes.json();
          if (wData.url) {
            setActiveWebsiteUrl(wData.url);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
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
            className={`grid gap-5 flex-1 ${
              orientation === 'columns'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            <YouTubePanel videoUrl={activeVideoUrl} />
            <WebsitePanel websiteUrl={activeWebsiteUrl} />
          </div>
        ) : viewMode === 'youtube' ? (
          <div className="flex-1 flex flex-col">
            <YouTubePanel videoUrl={activeVideoUrl} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <WebsitePanel websiteUrl={activeWebsiteUrl} />
          </div>
        )}
      </main>
    </div>
  );
}
