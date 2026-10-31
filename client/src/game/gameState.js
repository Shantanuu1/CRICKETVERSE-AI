/**
 * gameState.js
 * Central match state manager for CricketVerse AI.
 * Tracks deterministic score, overs, strike rates, shot distributions, and timeline.
 */

import { formatOvers } from './scoring';

export function createInitialMatchState(oversLimit = 2, target = 32) {
  return {
    runs: 0,
    balls: 0,
    wickets: 0,
    fours: 0,
    sixes: 0,
    dot_balls: 0,
    oversLimit,
    maxBalls: oversLimit * 6,
    target,
    status: 'IDLE', // 'IDLE', 'BOWLING', 'PLAYING', 'COMPLETED'
    resultMessage: null,
    shot_distribution: {
      defensive: 0,
      leg_side: 0,
      off_side: 0,
      lofted: 0,
      leave: 0
    },
    timeline: []
  };
}

export function recordDelivery(state, ballResult) {
  if (state.status === 'COMPLETED') return state;

  const nextBalls = state.balls + 1;
  const nextRuns = state.runs + ballResult.runs;
  const nextWickets = state.wickets + (ballResult.isWicket ? 1 : 0);

  const nextFours = state.fours + (ballResult.runs === 4 ? 1 : 0);
  const nextSixes = state.sixes + (ballResult.runs === 6 ? 1 : 0);
  const nextDots = state.dot_balls + (ballResult.runs === 0 && !ballResult.isWicket ? 1 : 0);

  // Update shot distribution
  const nextDist = { ...state.shot_distribution };
  if (ballResult.shotTypeKey === 'DEFENSIVE_SHOT') nextDist.defensive++;
  else if (ballResult.shotTypeKey === 'LEG_SIDE_SHOT') nextDist.leg_side++;
  else if (ballResult.shotTypeKey === 'OFF_SIDE_SHOT') nextDist.off_side++;
  else if (ballResult.shotTypeKey === 'LOFTED_SHOT') nextDist.lofted++;
  else if (ballResult.shotTypeKey === 'LEAVE_BALL') nextDist.leave++;

  const timelineEntry = {
    ballNumber: nextBalls,
    runs: ballResult.runs,
    isWicket: ballResult.isWicket,
    dismissalType: ballResult.dismissalType,
    eventType: ballResult.eventType,
    timing: ballResult.timing,
    shotName: ballResult.shotName,
    shotTypeKey: ballResult.shotTypeKey,
    totalScoreAfter: nextRuns,
    wicketsAfter: nextWickets,
    oversAfter: formatOvers(nextBalls),
    timestamp: Date.now()
  };

  const nextTimeline = [...state.timeline, timelineEntry];

  // Match completion criteria: all out, target chased, or overs finished
  let nextStatus = 'PLAYING';
  let resultMessage = null;

  if (nextRuns >= state.target) {
    nextStatus = 'COMPLETED';
    resultMessage = `VICTORY! Chased target of ${state.target} runs in ${formatOvers(nextBalls)} overs!`;
  } else if (nextWickets >= 10) {
    nextStatus = 'COMPLETED';
    resultMessage = `ALL OUT! Scored ${nextRuns}/${nextWickets}. Target was ${state.target}.`;
  } else if (nextBalls >= state.maxBalls) {
    nextStatus = 'COMPLETED';
    if (nextRuns >= state.target) {
      resultMessage = `VICTORY! Reached ${nextRuns}/${nextWickets} in ${state.oversLimit} overs!`;
    } else {
      resultMessage = `DEFEAT! Scored ${nextRuns}/${nextWickets}, falling ${state.target - nextRuns} runs short of target.`;
    }
  }

  return {
    ...state,
    runs: nextRuns,
    balls: nextBalls,
    wickets: nextWickets,
    fours: nextFours,
    sixes: nextSixes,
    dot_balls: nextDots,
    shot_distribution: nextDist,
    status: nextStatus,
    resultMessage,
    timeline: nextTimeline
  };
}

export function computeSummaryMetrics(state) {
  const strikeRate = state.balls > 0 ? Number(((state.runs / state.balls) * 100).toFixed(2)) : 0;
  const currentRunRate = state.balls > 0 ? Number(((state.runs / state.balls) * 6).toFixed(2)) : 0;
  const ballsRemaining = Math.max(0, state.maxBalls - state.balls);
  const runsNeeded = Math.max(0, state.target - state.runs);
  const requiredRunRate = ballsRemaining > 0 ? Number(((runsNeeded / ballsRemaining) * 6).toFixed(2)) : 0;

  return {
    strikeRate,
    currentRunRate,
    ballsRemaining,
    runsNeeded,
    requiredRunRate,
    oversFormatted: formatOvers(state.balls)
  };
}
