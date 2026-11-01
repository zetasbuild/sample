'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, LogOut, User } from 'lucide-react';
import { YouTubeIcon } from './Icons';

interface NavbarProps {
  adminUser: { username: string } | null;
  onLogout?: () => void;
}

export default function Navbar({ adminUser, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-xl group-hover:bg-red-100 transition-colors">
            <YouTubeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-red-600 transition-colors">
                Video Player
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Admin Curated Video Player
            </p>
          </div>
        </Link>

        {/* Right Actions: User Status / Admin Controls */}
        <div className="flex items-center gap-2.5">
          {adminUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono">{adminUser.username}</span>
              </div>

              <Link
                href="/admin"
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </Link>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
