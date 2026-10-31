/**
 * scoring.js
 * Deterministic Cricket Scoring Rules Engine.
 * Calculates ball outcomes, wickets, runs, and strike rates based on
 * shot selection and contact timing. Does not rely on AI for scoring.
 */

export const SHOT_TYPES = {
  DEFENSIVE_SHOT: {
    name: 'Defensive Block',
    gesture: 'OPEN_PALM',
    runOptions: [0, 0, 0, 1],
    wicketRisk: 0.05
  },
  LEG_SIDE_SHOT: {
    name: 'Leg-Side Flick',
    gesture: 'SWIPE_LEFT',
    runOptions: [1, 1, 2, 4],
    wicketRisk: 0.15
  },
  OFF_SIDE_SHOT: {
    name: 'Off-Side Cover Drive',
    gesture: 'SWIPE_RIGHT',
    runOptions: [1, 2, 4, 4],
    wicketRisk: 0.15
  },
  LOFTED_SHOT: {
    name: 'Lofted Maximum Drive',
    gesture: 'RAISED_PALM',
    runOptions: [4, 6, 6],
    wicketRisk: 0.35 // Higher risk for 6s
  },
  LEAVE_BALL: {
    name: 'Leave Ball',
    gesture: 'CLOSED_FIST',
    runOptions: [0],
    wicketRisk: 0.08
  }
};

export const TIMING_WINDOWS = {
  PERFECT: { label: 'PERFECT TIMING', multiplier: 1.0, quality: 'elite' },
  GOOD: { label: 'GOOD CONTACT', multiplier: 0.8, quality: 'good' },
  EARLY: { label: 'EARLY ON SHOT', multiplier: 0.4, quality: 'poor' },
  LATE: { label: 'LATE ON SHOT', multiplier: 0.4, quality: 'poor' },
  MISSED: { label: 'PLAYED & MISSED', multiplier: 0.0, quality: 'miss' }
};

export function calculateBallResult(shotTypeKey, timingKey, ballTrajectory = 'NORMAL') {
  const shot = SHOT_TYPES[shotTypeKey] || SHOT_TYPES.DEFENSIVE_SHOT;
  const timing = TIMING_WINDOWS[timingKey] || TIMING_WINDOWS.MISSED;

  // 1. Missed timing: High chance of bowled or dot ball
  if (timingKey === 'MISSED') {
    const isBowled = Math.random() < 0.45;
    return {
      runs: 0,
      isWicket: isBowled,
      dismissalType: isBowled ? 'Bowled' : null,
      eventType: isBowled ? 'WICKET' : 'DOT',
      timing: timing.label,
      shotName: shot.name,
      description: isBowled
        ? 'Beaten for pace! The ball clips the off-stump, sending bails flying!'
        : 'Beaten all ends up outside off-stump! Dot ball.'
    };
  }

  // 2. Leaving the delivery
  if (shotTypeKey === 'LEAVE_BALL') {
    // If delivery was straight and pitched at stumps, leaving gets you bowled
    if (ballTrajectory === 'STRAIGHT_YORKER') {
      return {
        runs: 0,
        isWicket: true,
        dismissalType: 'Bowled',
        eventType: 'WICKET',
        timing: timing.label,
        shotName: shot.name,
        description: 'Fatal misjudgment! Bowled leaving a straight ball on middle stump!'
      };
    }
    return {
      runs: 0,
      isWicket: false,
      dismissalType: null,
      eventType: 'DOT',
      timing: 'JUDICIOUS LEAVE',
      shotName: shot.name,
      description: 'Well left outside off stump. No run.'
    };
  }

  // 3. Early or Late timing: Higher risk of mistimed catch
  if (timingKey === 'EARLY' || timingKey === 'LATE') {
    const isCaught = Math.random() < (shot.wicketRisk * 1.8);
    if (isCaught) {
      return {
        runs: 0,
        isWicket: true,
        dismissalType: 'Caught',
        eventType: 'WICKET',
        timing: timing.label,
        shotName: shot.name,
        description: `Mistimed ${shot.name.toLowerCase()}! Spliced high in the air and taken cleanly!`
      };
    }
    // Edged or squeezed for 0 or 1
    const runs = Math.random() < 0.6 ? 0 : 1;
    return {
      runs,
      isWicket: false,
      dismissalType: null,
      eventType: runs === 0 ? 'DOT' : 'SINGLE',
      timing: timing.label,
      shotName: shot.name,
      description: runs === 0 ? 'Thick inside edge onto the pads. Dot ball.' : 'Squirted off the outer edge for a single.'
    };
  }

  // 4. Perfect or Good timing: Runs awarded according to shot potential
  if (timingKey === 'PERFECT') {
    if (shotTypeKey === 'LOFTED_SHOT') {
      return {
        runs: 6,
        isWicket: false,
        dismissalType: null,
        eventType: 'SIX',
        timing: timing.label,
        shotName: shot.name,
        description: 'MONUMENTAL SIX! Launched high, handsome, and into the crowd!'
      };
    }
    if (shotTypeKey === 'OFF_SIDE_SHOT' || shotTypeKey === 'LEG_SIDE_SHOT') {
      return {
        runs: 4,
        isWicket: false,
        dismissalType: null,
        eventType: 'FOUR',
        timing: timing.label,
        shotName: shot.name,
        description: `Glorious ${shot.name.toLowerCase()}! Races across the outfield for FOUR!`
      };
    }
    // Defensive with perfect timing
    return {
      runs: 1,
      isWicket: false,
      dismissalType: null,
      eventType: 'SINGLE',
      timing: timing.label,
      shotName: shot.name,
      description: 'Soft hands, dropped right at the feet for a sharp single.'
    };
  }

  // Good timing
  const pool = shot.runOptions;
  const runs = pool[Math.floor(Math.random() * pool.length)];
  let eventType = 'DOT';
  if (runs === 1) eventType = 'SINGLE';
  else if (runs === 2) eventType = 'DOUBLE';
  else if (runs === 4) eventType = 'FOUR';
  else if (runs === 6) eventType = 'SIX';

  return {
    runs,
    isWicket: false,
    dismissalType: null,
    eventType,
    timing: timing.label,
    shotName: shot.name,
    description: `Clean contact with the ${shot.name.toLowerCase()}, picking up ${runs} run${runs === 1 ? '' : 's'}.`
  };
}

export function formatOvers(balls) {
  const completed = Math.floor(balls / 6);
  const remaining = balls % 6;
  return `${completed}.${remaining}`;
}
