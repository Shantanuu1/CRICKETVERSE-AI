/**
 * App.jsx
 * Root application component for CricketVerse AI.
 * Hosts persistent navigation, view routing, match state, and AI runtime status.
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/shared/Navbar';
import HomeView from './components/views/HomeView';
import GameView from './components/views/GameView';
import GestureLabView from './components/views/GestureLabView';
import DashboardView from './components/views/DashboardView';
import AICoachView from './components/views/AICoachView';
import CommentaryView from './components/views/CommentaryView';
import RulesView from './components/views/RulesView';
import { createInitialMatchState } from './game/gameState';
import { fetchOllamaStatus } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [matchState, setMatchState] = useState(() => createInitialMatchState(2, 32));
  const [ollamaStatus, setOllamaStatus] = useState({
    online: false,
    model_name: 'gemma4:e2b',
    telemetry: {
      model_name: 'gemma4:e2b',
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      fallback_count: 0,
      average_latency_ms: 0
    }
  });

  // Poll AI service health & telemetry periodically
  useEffect(() => {
    const checkStatus = () => {
      fetchOllamaStatus()
        .then((data) => {
          if (data) {
            setOllamaStatus(data);
          }
        })
        .catch(() => {
          setOllamaStatus((prev) => ({
            ...prev,
            online: false
          }));
        });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-lime-400 selection:text-slate-950">
      {/* Persistent Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ollamaStatus={ollamaStatus}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeView setActiveTab={setActiveTab} />
        )}
        {activeTab === 'game' && (
          <GameView
            matchState={matchState}
            setMatchState={setMatchState}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'lab' && (
          <GestureLabView />
        )}
        {activeTab === 'dashboard' && (
          <DashboardView
            matchState={matchState}
            setMatchState={setMatchState}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'coach' && (
          <AICoachView
            matchState={matchState}
            ollamaStatus={ollamaStatus}
            setOllamaStatus={setOllamaStatus}
          />
        )}
        {activeTab === 'commentary' && (
          <CommentaryView matchState={matchState} />
        )}
        {activeTab === 'rules' && (
          <RulesView />
        )}
      </main>
    </div>
  );
}
