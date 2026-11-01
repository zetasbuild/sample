'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import YouTubePanel from '@/components/YouTubePanel';

export default function HomePage() {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('https://youtu.be/TtJILk3vXnc');
  const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);

  // Fetch initial video and auth status
  useEffect(() => {
    async function loadData() {
      try {
        const [videoRes, authRes] = await Promise.all([
          fetch('/api/video'),
          fetch('/api/auth/me')
        ]);

        if (videoRes.ok) {
          const vData = await videoRes.json();
          if (vData.url) {
            setActiveVideoUrl(vData.url);
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar adminUser={adminUser} onLogout={handleLogout} />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <YouTubePanel videoUrl={activeVideoUrl} />
      </main>
    </div>
  );
}
