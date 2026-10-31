/**
 * RulesView.jsx
 * Cricket Rules Assistant powered by curated MCC laws & Google Gemma 4.
 * Searchable knowledge base with interactive AI rule clarifications.
 */

import React, { useState, useEffect } from 'react';
import { askRules, fetchAllRules } from '../../services/api';
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  Sparkles, 
  Send, 
  CheckCircle, 
  ShieldAlert, 
  ExternalLink 
} from 'lucide-react';

export default function RulesView() {
  const [rules, setRules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [isAsking, setIsAsking] = useState(false);

  // Load curated rules on mount
  useEffect(() => {
    fetchAllRules().then((res) => {
      if (res && res.rules) setRules(res.rules);
    }).catch(err => console.warn(err));
  }, []);

  const handleAskAI = async (qToSend) => {
    const q = qToSend || aiQuestion;
    if (!q.trim() || isAsking) return;

    setIsAsking(true);
    try {
      const resp = await askRules(q);
      setAiAnswer(resp);
    } catch (err) {
      setAiAnswer({
        answer: "Unable to reach rules server. Please check your network connection.",
        is_fallback: true,
        provider: "offline-rules-fallback"
      });
    } finally {
      setIsAsking(false);
    }
  };

  const categories = ['ALL', 'Dismissal', 'Fair and Unfair Play', 'Tournament Playing Conditions', 'Match Structure', 'Scoring', 'Analytics & Metrics'];

  const filteredRules = rules.filter((r) => {
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-lime-400">MCC Knowledge Base</span>
          <h1 className="text-3xl font-black font-display text-white">Cricket Rules Assistant</h1>
          <p className="text-sm text-slate-400">
            Curated official cricket laws, boundary regulations, and Google Gemma 4 explanations.
          </p>
        </div>
      </div>

      {/* AI Query Box */}
      <div className="glass-card p-6 space-y-4 border-l-4 border-l-lime-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-lime-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Ask Gemma AI Cricket Rules Assistant</h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAI();
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="e.g. Can a batsman be given LBW if the ball pitches outside leg stump?"
              className="w-full bg-slate-900 border border-slate-800 focus:border-lime-400 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!aiQuestion.trim() || isAsking}
            className="px-6 py-3 bg-lime-400 hover:bg-lime-300 disabled:opacity-40 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-lg shrink-0"
          >
            {isAsking ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ask Gemma</span>
          </button>
        </form>

        {/* Quick prompt suggestions */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] text-slate-400">
          <span className="shrink-0 font-semibold text-slate-300">Try asking:</span>
          {['What is the LBW rule?', 'Explain Free Hit regulations', 'How do Powerplay overs work?'].map((sample, i) => (
            <button
              key={i}
              onClick={() => {
                setAiQuestion(sample);
                handleAskAI(sample);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* AI Answer Box */}
        {aiAnswer && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-lime-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Verified Cricket Law Explanation
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                aiAnswer.is_fallback
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-purple-950/60 border-purple-500/40 text-purple-300'
              }`}>
                {aiAnswer.provider || 'gemma4:e2b'}
              </span>
            </div>

            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
              {aiAnswer.answer}
            </div>
          </div>
        )}
      </div>

      {/* Rules Knowledge Base Explorer */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold font-display text-white">Curated Laws Directory</h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-lime-400 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Rule Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="glass-card p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-lime-400 border border-slate-700">
                    {rule.category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{rule.id}</span>
                </div>

                <h3 className="text-lg font-black text-white">{rule.name}</h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {rule.summary}
                </p>

                {rule.conditions && rule.conditions.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Conditions:</span>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {rule.conditions.map((cond, i) => (
                        <li key={i}>{cond}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {rule.tactical_tip && (
                <div className="mt-4 p-3 rounded-xl bg-lime-950/30 border border-lime-400/20 text-xs text-lime-200">
                  <strong className="text-lime-400 block font-bold mb-0.5">Tactical Tip:</strong>
                  {rule.tactical_tip}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
