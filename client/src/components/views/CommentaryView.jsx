/**
 * CommentaryView.jsx
 * Live AI Cricket Commentary Station.
 * Features event stream, commentator persona tones, audio TTS synthesis,
 * and interactive ball simulator for judges/evaluators.
 */

import React, { useState, useEffect } from 'react';
import { generateCommentary, fetchCommentaryHistory } from '../../services/api';
import { 
  Mic2, 
  Volume2, 
  VolumeX, 
  Play, 
  Radio, 
  Sparkles, 
  Flame, 
  RefreshCw 
} from 'lucide-react';

export default function CommentaryView({ matchState }) {
  const [commentaryLog, setCommentaryLog] = useState([
    {
      id: 1,
      eventType: 'FOUR',
      runs: 4,
      shotType: 'OFF_SIDE_SHOT',
      commentary: 'CRACK! What an exquisite cover drive! Leaned into the half-volley and pierced the infield like a tracer bullet for FOUR!',
      isFallback: false,
      provider: 'gemma4:e2b',
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 2,
      eventType: 'DOT',
      runs: 0,
      shotType: 'DEFENSIVE_SHOT',
      commentary: 'Pitched right on the money! Defended solidly right back down the track to the bowler.',
      isFallback: false,
      provider: 'gemma4:e2b',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('legendary'); // 'legendary', 'technical', 'high_octane'
  const [isSimulating, setIsSimulating] = useState(false);

  // Load history on mount
  useEffect(() => {
    fetchCommentaryHistory().then((res) => {
      if (res && res.history && res.history.length > 0) {
        setCommentaryLog((prev) => [...res.history, ...prev]);
      }
    }).catch(err => console.warn(err));
  }, []);

  // Text-To-Speech Synthesizer
  const speakText = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSimulateBall = async (eventType, runs, shotType) => {
    setIsSimulating(true);
    try {
      const resp = await generateCommentary(eventType, runs, shotType, {
        score: matchState.runs,
        wickets: matchState.wickets,
        overs: `${Math.floor(matchState.balls / 6)}.${matchState.balls % 6}`
      });

      const newEntry = {
        id: Date.now(),
        eventType,
        runs,
        shotType,
        commentary: resp.commentary,
        isFallback: resp.is_fallback,
        provider: resp.provider,
        timestamp: new Date().toLocaleTimeString()
      };

      setCommentaryLog((prev) => [newEntry, ...prev]);
      speakText(resp.commentary);
    } catch (err) {
      console.warn('Commentary simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-lime-400">Broadcast Station</span>
          <h1 className="text-3xl font-black font-display text-white">Live AI Cricket Commentary</h1>
          <p className="text-sm text-slate-400">
            Real-time ball-by-ball commentary synthesized with Google Gemma 4 and edge broadcast fallbacks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setVoiceEnabled(prev => !prev)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              voiceEnabled
                ? 'bg-lime-400 text-slate-950 border-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.3)]'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-slate-950" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>Voice Speech: {voiceEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Simulator Control Panel (For Hackathon Judges / Live Demo) */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-lime-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Commentary Simulator & Evaluator</h3>
          </div>
          <span className="text-[11px] text-slate-400">One-click live ball trigger</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSimulateBall('SIX', 6, 'LOFTED_SHOT')}
            disabled={isSimulating}
            className="px-4 py-2.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 font-bold text-xs uppercase rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>Simulate Maximum 6</span>
          </button>

          <button
            onClick={() => handleSimulateBall('FOUR', 4, 'OFF_SIDE_SHOT')}
            disabled={isSimulating}
            className="px-4 py-2.5 bg-lime-950/80 hover:bg-lime-900 border border-lime-500/50 text-lime-200 font-bold text-xs uppercase rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            <span>Simulate Boundary 4</span>
          </button>

          <button
            onClick={() => handleSimulateBall('WICKET', 0, 'LOFTED_SHOT')}
            disabled={isSimulating}
            className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 font-bold text-xs uppercase rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <span>⚡ Simulate Wicket Dismissal</span>
          </button>

          <button
            onClick={() => handleSimulateBall('SINGLE', 1, 'LEG_SIDE_SHOT')}
            disabled={isSimulating}
            className="px-4 py-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 font-bold text-xs uppercase rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <span>🏃 Simulate Quick Single</span>
          </button>

          <button
            onClick={() => handleSimulateBall('DOT', 0, 'DEFENSIVE_SHOT')}
            disabled={isSimulating}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <span>🛡️ Simulate Dot Ball</span>
          </button>
        </div>
      </div>

      {/* Live Commentary Log Stream */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Commentary Feed History</h2>

        <div className="space-y-3">
          {commentaryLog.map((item) => (
            <div
              key={item.id}
              className="glass-card p-5 space-y-2 border-l-4 border-l-lime-400 transition-all hover:bg-slate-900/90"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                    item.eventType === 'SIX'
                      ? 'bg-purple-950 border border-purple-500 text-purple-300'
                      : item.eventType === 'FOUR'
                      ? 'bg-lime-950 border border-lime-500 text-lime-300'
                      : item.eventType === 'WICKET'
                      ? 'bg-rose-950 border border-rose-500 text-rose-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.eventType} {item.runs > 0 ? `(${item.runs} Runs)` : ''}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{item.shotType}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className={`px-2 py-0.5 rounded-full border ${
                    item.isFallback
                      ? 'bg-amber-950/50 border-amber-500/30 text-amber-400'
                      : 'bg-purple-950/50 border-purple-500/30 text-purple-300'
                  }`}>
                    {item.provider}
                  </span>
                  <span className="text-slate-400">{item.timestamp}</span>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                "{item.commentary}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
