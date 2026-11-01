'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Columns2, 
  Rows2, 
  Globe, 
  LayoutGrid, 
  ShieldCheck, 
  Lock, 
  LogOut 
} from 'lucide-react';
import { YouTubeIcon } from './Icons';

interface NavbarProps {
  viewMode: 'split' | 'youtube' | 'website';
  setViewMode: (mode: 'split' | 'youtube' | 'website') => void;
  orientation: 'columns' | 'rows';
  setOrientation: (o: 'columns' | 'rows') => void;
  adminUser: { username: string } | null;
  onLogout?: () => void;
}

export default function Navbar({
  viewMode,
  setViewMode,
  orientation,
  setOrientation,
  adminUser,
  onLogout
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 sm:px-6 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <YouTubeIcon className="w-4 h-4 text-red-600" />
            <span className="text-slate-400 text-xs">/</span>
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                DualView Panel
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                Next.js
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Admin Curated Video &amp; Website Dual Viewer
            </p>
          </div>
        </div>

        {/* View Switchers & Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Split View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>

            <button
              onClick={() => setViewMode('youtube')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded transition-all cursor-pointer ${
                viewMode === 'youtube'
                  ? 'bg-white text-red-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="YouTube Only"
            >
              <YouTubeIcon className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>

            <button
              onClick={() => setViewMode('website')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded transition-all cursor-pointer ${
                viewMode === 'website'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Website Only"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Website</span>
            </button>
          </div>

          {/* Orientation Toggle (Columns vs Rows) */}
          {viewMode === 'split' && (
            <button
              onClick={() => setOrientation(orientation === 'columns' ? 'rows' : 'columns')}
              className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
              title={orientation === 'columns' ? 'Switch to Stacked (Rows)' : 'Switch to Side-by-Side (Columns)'}
            >
              {orientation === 'columns' ? (
                <Columns2 className="w-4 h-4" />
              ) : (
                <Rows2 className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Admin Button */}
          {adminUser ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="pl-2 border-l border-slate-200">
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Admin Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
