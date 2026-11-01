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
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1.5 rounded-lg">
            <YouTubeIcon className="w-4 h-4 text-red-500" />
            <span className="text-slate-500 text-xs">/</span>
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                DualView Panel
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                Next.js
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Paste YouTube link &amp; preview websites side-by-side
            </p>
          </div>
        </div>

        {/* View Switchers & Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded transition-all ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Split View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>

            <button
              onClick={() => setViewMode('youtube')}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded transition-all ${
                viewMode === 'youtube'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="YouTube Only"
            >
              <YouTubeIcon className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </button>

            <button
              onClick={() => setViewMode('website')}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded transition-all ${
                viewMode === 'website'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
              className="p-1.5 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-lg transition-colors"
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
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="pl-2 border-l border-slate-800">
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Admin Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
