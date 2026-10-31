/**
 * api.js
 * Frontend REST Client for CricketVerse AI Server & Orchestrator.
 */

const API_BASE = '/api';

export async function fetchHealth() {
  const resp = await fetch(`${API_BASE}/health`);
  return resp.json();
}

export async function fetchOllamaStatus() {
  const resp = await fetch(`${API_BASE}/ollama/status`);
  return resp.json();
}

export async function analyzeMatch(matchData, userQuery = null) {
  const resp = await fetch(`${API_BASE}/coach/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ match_data: matchData, user_query: userQuery })
  });
  return resp.json();
}

export async function chatCoach(message, matchData = null) {
  const resp = await fetch(`${API_BASE}/coach/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, match_data: matchData })
  });
  return resp.json();
}

export async function generateCommentary(eventType, runs = 0, shotType = 'SHOT', context = null) {
  const resp = await fetch(`${API_BASE}/commentary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType, runs, shot_type: shotType, context })
  });
  return resp.json();
}

export async function fetchCommentaryHistory() {
  const resp = await fetch(`${API_BASE}/commentary/history`);
  return resp.json();
}

export async function askRules(question) {
  const resp = await fetch(`${API_BASE}/rules/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  return resp.json();
}

export async function fetchAllRules() {
  const resp = await fetch(`${API_BASE}/rules/all`);
  return resp.json();
}
