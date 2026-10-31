/**
 * HomeView.jsx
 * Premium landing page for CricketVerse AI.
 * Neo-brutalist / modern sports tech design.
 */

import React from 'react';
import { 
  Gamepad2, 
  Sparkles, 
  Camera, 
  BarChart3, 
  Mic2, 
  BookOpen, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Eye
} from 'lucide-react';

export default function HomeView({ setActiveTab }) {
  const features = [
    {
      title: 'Hand Gesture Cricket',
      desc: 'Control every shot via your webcam using MediaPipe 21 hand landmarks. Open palm defends, swiping drives, raised palm lofts!',
      icon: Camera,
      tag: 'Computer Vision',
      color: 'lime',
      action: () => setActiveTab('game')
    },
    {
      title: 'AI Tactical Coach (Gemma 4)',
      desc: 'Powered by local Google Gemma 4 E2B. Analyzes real match stats to identify dot ball pressure, shot bias, and customized drills.',
      icon: Sparkles,
      tag: 'Google Gemma 4',
      color: 'purple',
      action: () => setActiveTab('coach')
    },
    {
      title: 'Live AI Broadcast Commentary',
      desc: 'Contextual ball-by-ball commentary generated dynamically for boundaries, wickets, and defensive blocks with rich persona styles.',
      icon: Mic2,
      tag: 'Edge Inference',
      color: 'cyan',
      action: () => setActiveTab('commentary')
    },
    {
      title: 'Match Analytics & Telemetry',
      desc: 'Chart.js performance visualizer tracking strike rate velocity, run wagon progression, shot distribution, and boundary ratios.',
      icon: BarChart3,
      tag: 'Data Analytics',
      color: 'amber',
      action: () => setActiveTab('dashboard')
    }
  ];

  const steps = [
    {
      num: '01',
      title: 'Calibrate Your Stance',
      desc: 'Open the Gesture Lab or Arena to allow MediaPipe to calibrate your hand reach, baseline wrist coordinates, and swipe thresholds.'
    },
    {
      num: '02',
      title: 'Step Up to the Crease',
      desc: 'Face deliveries from an animated 3D bowler. Read the bounce and execute defensive prods, leg glances, cover drives, or maximum lofted shots.'
    },
    {
      num: '03',
      title: 'Analyze with Gemma Coach',
      desc: 'Review data-grounded postmortem breakdowns, weakness discovery, and conversational coaching recommendations to level up your batting.'
    }
  ];

  const techStack = [
    { name: 'React 18 + Vite', category: 'Frontend' },
    { name: 'Three.js 3D', category: 'Graphics' },
    { name: 'MediaPipe Tasks Vision', category: 'Computer Vision' },
    { name: 'Node.js & Express', category: 'Main Server' },
    { name: 'Socket.IO', category: 'WebSockets' },
    { name: 'Python FastAPI', category: 'AI Orchestrator' },
    { name: 'Google Gemma 4 (e2b)', category: 'AI Model' },
    { name: 'Chart.js', category: 'Data Viz' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/95 p-8 md:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-bold tracking-wider uppercase">
            <Zap className="w-3.5 h-3.5" />
            <span>Next-Generation Cricket Gaming Ecosystem</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight text-white leading-tight">
            Play with your hands. <br />
            <span className="text-gradient-lime">Analyse with AI.</span> <br />
            Improve your game.
          </h1>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            CRICKETVERSE AI bridges computer vision, lightweight 3D cricket simulation, 
            and Google Gemma 4 edge intelligence. Play in real-time using browser webcam hand gestures, 
            hear dynamic ball commentary, and study data-backed tactical coaching critiques.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => setActiveTab('game')}
              className="px-8 py-3.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_24px_rgba(163,230,53,0.4)] flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Enter Play Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('coach')}
              className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm tracking-wider rounded-xl border border-slate-700/80 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Explore AI Coach</span>
            </button>

            <button
              onClick={() => setActiveTab('lab')}
              className="px-6 py-3.5 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 font-bold text-sm tracking-wider rounded-xl border border-slate-800 flex items-center gap-2 transition-all"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Gesture Lab</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="space-y-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-lime-400">Core Capabilities</span>
          <h2 className="text-2xl md:text-3xl font-black font-display text-white">Full-Stack Cricket Intelligence</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                onClick={feat.action}
                className="glass-card p-6 flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-lime-400" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-lime-300 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-lime-400 group-hover:translate-x-1 transition-transform">
                  <span>Launch Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="glass-card p-8 md:p-12 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-lime-400">Match Progression</span>
          <h2 className="text-2xl md:text-3xl font-black font-display text-white">How CRICKETVERSE AI Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((st, i) => (
            <div key={i} className="relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <span className="font-display font-black text-3xl text-lime-400/40">{st.num}</span>
              <h3 className="text-lg font-bold text-white">{st.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack Grid */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase font-extrabold tracking-widest text-lime-400">Under the Hood</span>
          <h2 className="text-2xl font-black font-display text-white">Engineering Architecture</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {techStack.map((tech, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{tech.category}</span>
              <span className="text-sm font-extrabold text-white">{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 pt-8 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-white">CRICKETVERSE AI</span>
          <span>— One-Day Hackathon Edition</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-200 cursor-pointer" onClick={() => setActiveTab('rules')}>Rules Guide</span>
          <span className="hover:text-slate-200 cursor-pointer" onClick={() => setActiveTab('coach')}>Gemma 4 Telemetry</span>
          <span>100% Local Inference & Privacy Compliant</span>
        </div>
      </footer>
    </div>
  );
}
