/**
 * AICoachView.jsx
 * AI Tactical Coach powered by Google Gemma 4 (gemma4:e2b) via Ollama.
 * Sections: Match Intelligence, Evidence Observations, Tactical Corrections,
 * Recommended Drills, Gemma Chat, and Model Telemetry.
 */

import React, { useState, useEffect } from 'react';
import { analyzeMatch, chatCoach, fetchOllamaStatus } from '../../services/api';
import { 
  Sparkles, 
  Send, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Dumbbell, 
  Cpu, 
  RefreshCw,
  MessageSquare,
  Bot
} from 'lucide-react';

export default function AICoachView({ matchState, ollamaStatus, setOllamaStatus }) {
  const [analysisReport, setAnalysisReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'coach',
      text: "Greetings! I'm your AI Tactical Coach powered by Google Gemma 4. I've inspected your match telemetry. Ask me anything about your batting technique, shot selection, or next-match blueprint!",
      isFallback: false
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Quick Preset Inquiries
  const samplePrompts = [
    'Analyse my batting performance.',
    'Why did I lose this match?',
    'How can I improve my strike rate?',
    'Which shots should I practise?',
    'Suggest a strategy for my next match.'
  ];

  // Run Match Analysis on Mount or when Match Changes
  useEffect(() => {
    runAnalysis();
  }, [matchState]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const payload = {
        runs: matchState.runs,
        balls: matchState.balls,
        wickets: matchState.wickets,
        fours: matchState.fours,
        sixes: matchState.sixes,
        dot_balls: matchState.dot_balls,
        shot_distribution: matchState.shot_distribution
      };

      const result = await analyzeMatch(payload);
      if (result && result.report) {
        setAnalysisReport(result);
        if (result.telemetry) {
          setOllamaStatus((prev) => ({ ...prev, telemetry: result.telemetry }));
        }
      }
    } catch (err) {
      console.warn('Error running AI Coach analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (msgToSend) => {
    const text = msgToSend || inputMessage;
    if (!text.trim() || isSendingChat) return;

    const userEntry = { sender: 'user', text };
    setChatMessages((prev) => [...prev, userEntry]);
    setInputMessage('');
    setIsSendingChat(true);

    try {
      const payload = {
        runs: matchState.runs,
        balls: matchState.balls,
        wickets: matchState.wickets,
        fours: matchState.fours,
        sixes: matchState.sixes,
        dot_balls: matchState.dot_balls
      };

      const resp = await chatCoach(text, payload);
      if (resp && resp.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'coach',
            text: resp.reply,
            isFallback: Boolean(resp.is_fallback),
            provider: resp.provider
          }
        ]);
        if (resp.telemetry) {
          setOllamaStatus((prev) => ({ ...prev, telemetry: resp.telemetry }));
        }
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'coach',
          text: "I encountered an issue querying the model, but here's a fundamental tip: maintain head stability directly over the ball at the moment of contact to eliminate sliced edges.",
          isFallback: true,
          provider: "offline-coach-engine"
        }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const report = analysisReport?.report;
  const isFallback = analysisReport?.is_fallback;
  const telemetry = ollamaStatus?.telemetry || {
    model_name: 'gemma4:e2b',
    total_requests: 0,
    successful_requests: 0,
    failed_requests: 0,
    fallback_count: 0,
    average_latency_ms: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400">Google Gemma 4</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              ollamaStatus?.online 
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' 
                : 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
            }`}>
              {ollamaStatus?.online ? 'Ollama: Online' : 'Ollama: Offline (Fallback Mode)'}
            </span>
          </div>
          <h1 className="text-3xl font-black font-display text-white">AI Tactical Coach</h1>
          <p className="text-sm text-slate-400">
            Post-match tactical diagnostics, evidence observations, and interactive technical consultation.
          </p>
        </div>

        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-lime-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing...' : 'Re-Run Tactical Audit'}</span>
        </button>
      </div>

      {/* Model Telemetry Panel */}
      <div className="glass-card p-5 space-y-3 border-l-4 border-l-purple-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Model Telemetry & Runtime Metrics</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Provider: <strong className="text-purple-300">{analysisReport?.provider || 'gemma4:e2b'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Model:</span>
            <strong className="text-white text-xs">{telemetry.model_name || 'gemma4:e2b'}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Total AI Requests:</span>
            <strong className="text-lime-400 text-xs">{telemetry.total_requests || 0}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Successful Calls:</span>
            <strong className="text-emerald-400 text-xs">{telemetry.successful_requests || 0}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Failed / Offline:</span>
            <strong className="text-rose-400 text-xs">{telemetry.failed_requests || 0}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Fallback Count:</span>
            <strong className="text-amber-400 text-xs">{telemetry.fallback_count || 0}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Avg Latency:</span>
            <strong className="text-cyan-400 text-xs">
              {telemetry.average_latency_ms || analysisReport?.latency_ms || 0} ms
            </strong>
          </div>
        </div>

        {isFallback && (
          <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Ollama is currently unreachable on <code>127.0.0.1:11434</code>. 
              The technical audit below is delivered via our high-fidelity deterministic cricket rules & analytics engine.
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Tactical Sections (Left) & Gemma Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: 4 Tactical Sections (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: MATCH INTELLIGENCE */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">1. Match Intelligence Summary</h2>
            </div>

            <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
              {report?.summary || "Analyzing match metrics..."}
            </div>
          </div>

          {/* SECTION 2: EVIDENCE OBSERVATIONS */}
          <div className="glass-card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">2. Evidence Observations</h2>
            </div>

            <div className="space-y-2">
              {report?.patterns && report.patterns.length > 0 ? (
                report.patterns.map((pat, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{pat}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No vulnerability flags detected in this innings.</p>
              )}
            </div>
          </div>

          {/* SECTION 3: TACTICAL CORRECTIONS */}
          <div className="glass-card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">3. Tactical Corrections</h2>
            </div>

            <div className="space-y-2">
              {report?.corrections && report.corrections.length > 0 ? (
                report.corrections.map((corr, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{corr}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">Corrections will appear upon match completion.</p>
              )}
            </div>
          </div>

          {/* SECTION 4: RECOMMENDED DRILLS */}
          <div className="glass-card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">4. Recommended Practice Drills</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report?.drills && report.drills.length > 0 ? (
                report.drills.map((drill, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-white">{drill.name}</strong>
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                        Drill
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{drill.focus}</p>
                    <span className="text-[11px] text-slate-400 font-mono block mt-1">{drill.reps}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">Drill routines ready once you face deliveries.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Gemma Chat Interface (1 col) */}
        <div className="space-y-6">
          <div className="glass-card p-5 flex flex-col h-[740px]">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-lime-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gemma Chat Assistant</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Local Gemma 4 E2B</span>
            </div>

            {/* Quick Sample Prompts */}
            <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-800/80">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-lime-400 text-slate-950 font-semibold rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none space-y-1'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.sender === 'coach' && msg.isFallback && (
                      <span className="text-[9px] text-amber-400/80 italic block pt-1">
                        *(Offline fallback response)*
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono uppercase">
                    {msg.sender === 'user' ? 'You' : 'Coach Gemma'}
                  </span>
                </div>
              ))}
              {isSendingChat && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic p-2">
                  <Sparkles className="w-3.5 h-3.5 text-lime-400 animate-spin" />
                  <span>Gemma Coach is calculating response...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="pt-3 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Gemma about your technique..."
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-lime-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSendingChat}
                className="p-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-40 text-slate-950 rounded-xl font-bold transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
