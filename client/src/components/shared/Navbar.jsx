/**
 * Navbar.jsx
 * Persistent Navigation Bar for CricketVerse AI.
 */

import React from 'react';
import { 
  Trophy, 
  Gamepad2, 
  Camera, 
  BarChart3, 
  Sparkles, 
  Mic2, 
  BookOpen, 
  Activity 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, ollamaStatus }) {
  const navItems = [
    { id: 'home', label: 'HOME', icon: Trophy },
    { id: 'game', label: 'PLAY ARENA', icon: Gamepad2 },
    { id: 'lab', label: 'GESTURE LAB', icon: Camera },
    { id: 'dashboard', label: 'DASHBOARD', icon: BarChart3 },
    { id: 'coach', label: 'AI TACTICAL COACH', icon: Sparkles },
    { id: 'commentary', label: 'COMMENTARY', icon: Mic2 },
    { id: 'rules', label: 'CRICKET RULES', icon: BookOpen }
  ];

  const isAiOnline = Boolean(ollamaStatus && ollamaStatus.online);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_16px_rgba(163,230,53,0.3)] group-hover:scale-105 transition-transform">
            <span className="text-slate-950 font-black text-xl font-display">🏏</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg tracking-wider text-white">CRICKETVERSE</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-lime-400 text-slate-950 uppercase tracking-widest">AI</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">Next-Gen Cricket Ecosystem</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider transition-all ${
                  isActive
                    ? 'bg-lime-400 text-slate-950 shadow-[0_0_12px_rgba(163,230,53,0.35)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* AI Status Telemetry Pill */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setActiveTab('coach')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
              isAiOnline
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}
            title={isAiOnline ? 'Gemma 4 local runtime online via Ollama' : 'Ollama offline; intelligent deterministic engine active'}
          >
            <span className={`w-2 h-2 rounded-full ${isAiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden sm:inline">Gemma 4:</span>
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {isAiOnline ? 'Online' : 'Fallback'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Nav Scroller */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto pt-3 pb-1 -mx-2 px-2 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap tracking-wider ${
                isActive
                  ? 'bg-lime-400 text-slate-950'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
