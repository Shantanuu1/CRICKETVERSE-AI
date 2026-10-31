/**
 * scoring.test.js
 * Unit tests for deterministic cricket scoring logic.
 */

import assert from 'assert';
import { calculateBallResult, formatOvers, SHOT_TYPES, TIMING_WINDOWS } from '../src/game/scoring.js';

console.log('Running client scoring tests...');

// 1. Test formatOvers
assert.strictEqual(formatOvers(0), '0.0');
assert.strictEqual(formatOvers(1), '0.1');
assert.strictEqual(formatOvers(6), '1.0');
assert.strictEqual(formatOvers(11), '1.5');
assert.strictEqual(formatOvers(12), '2.0');
console.log('[PASS] formatOvers tests passed');

// 2. Test Perfect Lofted Shot yields 6 runs
const perfectSix = calculateBallResult('LOFTED_SHOT', 'PERFECT');
assert.strictEqual(perfectSix.runs, 6);
assert.strictEqual(perfectSix.isWicket, false);
assert.strictEqual(perfectSix.eventType, 'SIX');
console.log('[PASS] Perfect Lofted Shot (SIX) passed');

// 3. Test Perfect Off-Side Drive yields 4 runs
const perfectFour = calculateBallResult('OFF_SIDE_SHOT', 'PERFECT');
assert.strictEqual(perfectFour.runs, 4);
assert.strictEqual(perfectFour.isWicket, false);
assert.strictEqual(perfectFour.eventType, 'FOUR');
console.log('[PASS] Perfect Off-side Drive (FOUR) passed');

// 4. Test Leave Ball
const leave = calculateBallResult('LEAVE_BALL', 'GOOD', 'NORMAL');
assert.strictEqual(leave.runs, 0);
assert.strictEqual(leave.isWicket, false);
assert.strictEqual(leave.eventType, 'DOT');
console.log('[PASS] Leave Ball passed');

// 5. Test Missed delivery
const missed = calculateBallResult('DEFENSIVE_SHOT', 'MISSED');
assert.strictEqual(missed.runs, 0);
assert(missed.eventType === 'DOT' || missed.eventType === 'WICKET');
console.log('[PASS] Missed delivery passed');

console.log('\nALL CLIENT SCORING TESTS PASSED SUCCESSFULLY!');
