/**
 * gesture.test.js
 * Unit tests for client-side CricketGestureRecognizer.
 */

import assert from 'assert';
import { CricketGestureRecognizer } from '../src/vision/gestureRecognition.js';

console.log('Running client gesture recognition tests...');

function createMockOpenPalm(wristY = 0.6) {
  const landmarks = [];
  landmarks.push({ x: 0.5, y: wristY, z: 0 }); // 0: Wrist
  // Thumb (1-4)
  landmarks.push({ x: 0.45, y: wristY - 0.05, z: 0 });
  landmarks.push({ x: 0.42, y: wristY - 0.10, z: 0 });
  landmarks.push({ x: 0.40, y: wristY - 0.15, z: 0 });
  landmarks.push({ x: 0.38, y: wristY - 0.20, z: 0 });
  // Index (5-8)
  landmarks.push({ x: 0.47, y: wristY - 0.08, z: 0 });
  landmarks.push({ x: 0.47, y: wristY - 0.16, z: 0 });
  landmarks.push({ x: 0.47, y: wristY - 0.22, z: 0 });
  landmarks.push({ x: 0.47, y: wristY - 0.28, z: 0 });
  // Middle (9-12)
  landmarks.push({ x: 0.50, y: wristY - 0.09, z: 0 });
  landmarks.push({ x: 0.50, y: wristY - 0.18, z: 0 });
  landmarks.push({ x: 0.50, y: wristY - 0.25, z: 0 });
  landmarks.push({ x: 0.50, y: wristY - 0.32, z: 0 });
  // Ring (13-16)
  landmarks.push({ x: 0.53, y: wristY - 0.08, z: 0 });
  landmarks.push({ x: 0.53, y: wristY - 0.16, z: 0 });
  landmarks.push({ x: 0.53, y: wristY - 0.22, z: 0 });
  landmarks.push({ x: 0.53, y: wristY - 0.28, z: 0 });
  // Pinky (17-20)
  landmarks.push({ x: 0.56, y: wristY - 0.06, z: 0 });
  landmarks.push({ x: 0.56, y: wristY - 0.12, z: 0 });
  landmarks.push({ x: 0.56, y: wristY - 0.17, z: 0 });
  landmarks.push({ x: 0.56, y: wristY - 0.22, z: 0 });
  return landmarks;
}

const recognizer = new CricketGestureRecognizer();

// Test 1: Open Palm at chest height -> DEFENSIVE_SHOT
const openPalm = createMockOpenPalm(0.6);
const defResult = recognizer.classify(openPalm);
assert.strictEqual(defResult.gesture, 'OPEN_PALM');
assert.strictEqual(defResult.shotName, 'DEFENSIVE_SHOT');
console.log('[PASS] Open Palm -> DEFENSIVE_SHOT passed');

// Test 2: Raised Open Palm -> LOFTED_SHOT (wristY < 0.35)
const raisedPalm = createMockOpenPalm(0.2);
const loftResult = recognizer.classify(raisedPalm);
assert.strictEqual(loftResult.gesture, 'RAISED_PALM');
assert.strictEqual(loftResult.shotName, 'LOFTED_SHOT');
console.log('[PASS] Raised Palm -> LOFTED_SHOT passed');

console.log('\nALL CLIENT GESTURE RECOGNITION TESTS PASSED SUCCESSFULLY!');
