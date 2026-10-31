/**
 * Unit tests for Node.js server core modules.
 */

const assert = require('assert');
const roomManager = require('../src/rooms/roomManager');
const orchestratorAdapter = require('../src/ai/OrchestratorAdapter');
const providerManager = require('../src/ai/ProviderManager');

async function runTests() {
  console.log('Running Node.js server tests...');

  // 1. RoomManager tests
  const testRoomId = 'test-room-101';
  const room = roomManager.createRoom(testRoomId, 'socket-1', { overs: 2, target: 25 });
  assert.strictEqual(room.id, testRoomId, 'Room id should match');
  assert.strictEqual(room.gameState.score, 0, 'Initial score should be 0');

  // Record a ball: 4 runs
  const updated1 = roomManager.recordBall(testRoomId, {
    runs: 4,
    isWicket: false,
    shotType: 'OFF_SIDE_SHOT'
  });
  assert.strictEqual(updated1.score, 4, 'Score should be 4');
  assert.strictEqual(updated1.balls, 1, 'Balls should be 1');
  assert.strictEqual(updated1.overs, '0.1', 'Overs should be 0.1');

  // Record a wicket
  const updated2 = roomManager.recordBall(testRoomId, {
    runs: 0,
    isWicket: true,
    shotType: 'LOFTED_SHOT'
  });
  assert.strictEqual(updated2.wickets, 1, 'Wickets should be 1');
  assert.strictEqual(updated2.overs, '0.2', 'Overs should be 0.2');
  console.log('[PASS] RoomManager ball recording and score calculation passed');

  // 2. ProviderManager Telemetry tests
  providerManager.recordRequest(45, false, true);
  providerManager.recordRequest(12, true, false);
  const telemetry = providerManager.getTelemetry();
  assert(telemetry.totalRequests >= 2, 'Total requests should increment');
  assert(telemetry.successfulRequests >= 1, 'Successful requests should be recorded');
  assert(telemetry.fallbackCount >= 1, 'Fallback count should be recorded');
  console.log('[PASS] ProviderManager telemetry recording passed');

  // 3. OrchestratorAdapter Fallback tests
  const fallbackAnalysis = await orchestratorAdapter.analyzeMatch({
    runs: 36,
    balls: 18,
    wickets: 1,
    fours: 3,
    sixes: 2,
    dot_balls: 5
  });
  assert.strictEqual(fallbackAnalysis.success, true, 'Analysis should succeed');
  assert(fallbackAnalysis.report.metrics.runs === 36, 'Runs should be 36');
  assert(fallbackAnalysis.is_fallback === true || fallbackAnalysis.is_fallback === false);
  console.log('[PASS] OrchestratorAdapter analysis response verified');

  const fallbackComm = await orchestratorAdapter.generateCommentary('SIX', 6, 'LOFTED_SHOT');
  assert(fallbackComm.commentary.length > 5, 'Commentary string should be populated');
  assert.strictEqual(fallbackComm.event_type, 'SIX', 'Event type should be SIX');
  console.log('[PASS] OrchestratorAdapter commentary generation verified');

  const fallbackRules = await orchestratorAdapter.askRules('LBW');
  assert(fallbackRules.matched_rules.length > 0, 'Matched rules should not be empty');
  console.log('[PASS] OrchestratorAdapter rules query verified');

  console.log('\nALL NODE.JS SERVER TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
