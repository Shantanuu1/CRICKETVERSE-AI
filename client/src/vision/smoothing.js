/**
 * smoothing.js
 * Landmark exponential smoothing and gesture voting buffer.
 * Eliminates jitter from camera sensor noise and stabilizes cricket gesture triggers.
 */

export class LandmarkSmoother {
  constructor(alpha = 0.35) {
    this.alpha = alpha;
    this.previousLandmarks = null;
  }

  smooth(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return landmarks;
    }

    if (!this.previousLandmarks || this.previousLandmarks.length !== landmarks.length) {
      this.previousLandmarks = landmarks.map(p => ({ ...p }));
      return landmarks;
    }

    const smoothed = landmarks.map((curr, i) => {
      const prev = this.previousLandmarks[i];
      return {
        x: this.alpha * curr.x + (1 - this.alpha) * prev.x,
        y: this.alpha * curr.y + (1 - this.alpha) * prev.y,
        z: this.alpha * (curr.z || 0) + (1 - this.alpha) * (prev.z || 0)
      };
    });

    this.previousLandmarks = smoothed;
    return smoothed;
  }

  reset() {
    this.previousLandmarks = null;
  }
}

export class GestureDebouncer {
  constructor(windowSize = 5, cooldownMs = 450) {
    this.windowSize = windowSize;
    this.cooldownMs = cooldownMs;
    this.history = [];
    this.lastTriggerTime = 0;
    this.lastTriggeredGesture = 'NEUTRAL';
  }

  push(gesture, confidence = 1.0) {
    const now = Date.now();
    this.history.push({ gesture, confidence, timestamp: now });
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    // Check cooldown
    if (now - this.lastTriggerTime < this.cooldownMs) {
      return {
        activeGesture: 'COOLDOWN',
        confidence: 0,
        isTriggerable: false
      };
    }

    // Tally votes
    const counts = {};
    for (const item of this.history) {
      counts[item.gesture] = (counts[item.gesture] || 0) + 1;
    }

    let dominantGesture = 'NEUTRAL';
    let maxCount = 0;
    for (const [g, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantGesture = g;
      }
    }

    const isTriggerable =
      dominantGesture !== 'NEUTRAL' &&
      maxCount >= Math.ceil(this.windowSize * 0.6);

    if (isTriggerable) {
      this.lastTriggerTime = now;
      this.lastTriggeredGesture = dominantGesture;
    }

    return {
      activeGesture: dominantGesture,
      confidence: maxCount / this.history.length,
      isTriggerable
    };
  }

  reset() {
    this.history = [];
    this.lastTriggerTime = 0;
  }
}
