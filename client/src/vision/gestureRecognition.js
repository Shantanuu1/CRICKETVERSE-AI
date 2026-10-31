/**
 * gestureRecognition.js
 * Advanced real-time cricket gesture classifier for MediaPipe Hand Landmarks.
 * Features rolling trajectory buffering, multi-frame velocity smoothing,
 * finger extension breakdown, and adaptive sensitivity.
 * 
 * Cricket Shot Mapping:
 * - OPEN PALM        => DEFENSIVE SHOT (Forward defensive block)
 * - SWIPE LEFT       => LEG-SIDE SHOT  (Flick / Pull / Glance)
 * - SWIPE RIGHT      => OFF-SIDE SHOT  (Cover drive / Cut / Punch)
 * - RAISED OPEN PALM => LOFTED SHOT    (Maximum aerial six / lofted drive)
 * - CLOSED FIST      => LEAVE BALL     (Shouldering arms / leaving delivery)
 */

function distance2D(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export class CricketGestureRecognizer {
  constructor(calibrationProfile = null) {
    this.profile = calibrationProfile || {
      swipeThresholdX: 0.35,      // Responsive swipe threshold
      raisedThresholdY: 0.38,     // Generous height for raised palm
      fistThreshold: 0.40,
      sensitivity: 'HIGH'         // 'NORMAL', 'HIGH', 'ULTRA'
    };

    this.prevWrist = null;
    this.prevTime = null;
    this.wristVelocity = { vx: 0, vy: 0 };
    this.trajectoryBuffer = [];   // Rolling window of recent positions for swipe detection
    this.bufferSize = 8;
  }

  updateProfile(profile) {
    this.profile = { ...this.profile, ...profile };
  }

  setSensitivity(mode) {
    if (mode === 'NORMAL') {
      this.profile.swipeThresholdX = 0.50;
      this.profile.sensitivity = 'NORMAL';
    } else if (mode === 'HIGH') {
      this.profile.swipeThresholdX = 0.32;
      this.profile.sensitivity = 'HIGH';
    } else if (mode === 'ULTRA') {
      this.profile.swipeThresholdX = 0.22;
      this.profile.sensitivity = 'ULTRA';
    }
  }

  updateTrajectory(wrist) {
    const now = performance.now();
    this.trajectoryBuffer.push({ x: wrist.x, y: wrist.y, time: now });
    if (this.trajectoryBuffer.length > this.bufferSize) {
      this.trajectoryBuffer.shift();
    }

    if (!this.prevWrist || !this.prevTime) {
      this.prevWrist = { ...wrist };
      this.prevTime = now;
      this.wristVelocity = { vx: 0, vy: 0 };
      return this.wristVelocity;
    }

    const dt = Math.max(0.005, (now - this.prevTime) / 1000); // seconds
    const rawVx = (wrist.x - this.prevWrist.x) / dt;
    const rawVy = (wrist.y - this.prevWrist.y) / dt;

    // Smoothed velocity with exponential decay
    this.wristVelocity = {
      vx: 0.45 * rawVx + 0.55 * this.wristVelocity.vx,
      vy: 0.45 * rawVy + 0.55 * this.wristVelocity.vy
    };

    this.prevWrist = { ...wrist };
    this.prevTime = now;
    return this.wristVelocity;
  }

  detectSwipeFromBuffer() {
    if (this.trajectoryBuffer.length < 3) return null;
    const first = this.trajectoryBuffer[0];
    const last = this.trajectoryBuffer[this.trajectoryBuffer.length - 1];
    const dx = last.x - first.x;
    const dt = Math.max(0.01, (last.time - first.time) / 1000);
    const speed = dx / dt;

    const threshold = this.profile.swipeThresholdX || 0.32;

    // In mirrored webcam: moving right is positive dx, moving left is negative dx
    if (dx < -0.06 || speed < -threshold) {
      return { direction: 'LEFT', speed: Math.abs(speed) };
    } else if (dx > 0.06 || speed > threshold) {
      return { direction: 'RIGHT', speed: Math.abs(speed) };
    }
    return null;
  }

  classify(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return {
        gesture: 'NEUTRAL',
        shotName: 'READY_STANCE',
        confidence: 0,
        isAction: false,
        velocity: { vx: 0, vy: 0 },
        fingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
        description: 'No hand detected in webcam'
      };
    }

    const wrist = landmarks[0];
    const velocity = this.updateTrajectory(wrist);
    const bufferSwipe = this.detectSwipeFromBuffer();

    // Finger landmarks:
    // Thumb: Tip 4, IP 3, MCP 2
    // Index: Tip 8, PIP 6, MCP 5
    // Middle: Tip 12, PIP 10, MCP 9
    // Ring: Tip 16, PIP 14, MCP 13
    // Pinky: Tip 20, PIP 18, MCP 17

    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    const fingerExtensions = [];

    for (let i = 0; i < 4; i++) {
      const tipDist = distance2D(landmarks[tips[i]], wrist);
      const pipDist = distance2D(landmarks[pips[i]], wrist);
      // Extended if tip is substantially further from wrist than PIP joint
      fingerExtensions.push(tipDist > pipDist * 1.08);
    }

    // Thumb check
    const thumbTipDist = distance2D(landmarks[4], wrist);
    const thumbMcpDist = distance2D(landmarks[2], wrist);
    const thumbExtended = thumbTipDist > thumbMcpDist * 1.15;

    const fingersState = {
      thumb: thumbExtended,
      index: fingerExtensions[0],
      middle: fingerExtensions[1],
      ring: fingerExtensions[2],
      pinky: fingerExtensions[3]
    };

    let extendedCount = fingerExtensions.filter(Boolean).length + (thumbExtended ? 1 : 0);

    const allOpen = extendedCount >= 4;
    const allCurled = extendedCount <= 1;

    // 1. Detect Lateral Swipes (Swipe Left = Leg-Side Shot, Swipe Right = Off-Side Shot)
    if (bufferSwipe) {
      if (bufferSwipe.direction === 'LEFT') {
        return {
          gesture: 'SWIPE_LEFT',
          shotName: 'LEG_SIDE_SHOT',
          confidence: Math.min(0.99, 0.80 + bufferSwipe.speed * 0.1),
          isAction: true,
          velocity,
          fingers: fingersState,
          description: 'Flick / Pull towards leg side (Swipe Left)'
        };
      } else if (bufferSwipe.direction === 'RIGHT') {
        return {
          gesture: 'SWIPE_RIGHT',
          shotName: 'OFF_SIDE_SHOT',
          confidence: Math.min(0.99, 0.80 + bufferSwipe.speed * 0.1),
          isAction: true,
          velocity,
          fingers: fingersState,
          description: 'Cover drive / Cut through off side (Swipe Right)'
        };
      }
    }

    // Direct velocity backup for rapid instantaneous flick
    if (Math.abs(velocity.vx) > 0.45) {
      if (velocity.vx < -0.45) {
        return {
          gesture: 'SWIPE_LEFT',
          shotName: 'LEG_SIDE_SHOT',
          confidence: 0.90,
          isAction: true,
          velocity,
          fingers: fingersState,
          description: 'Flick / Glance towards leg side'
        };
      } else if (velocity.vx > 0.45) {
        return {
          gesture: 'SWIPE_RIGHT',
          shotName: 'OFF_SIDE_SHOT',
          confidence: 0.90,
          isAction: true,
          velocity,
          fingers: fingersState,
          description: 'Square cut / Drive towards off side'
        };
      }
    }

    // 2. Detect Raised Open Palm (Lofted Shot / Six)
    // In camera coordinates, Y goes 0 (top) to 1 (bottom).
    // Wrist Y < raisedThreshold means hand is raised high up!
    const raisedThreshold = this.profile.raisedThresholdY || 0.38;
    if (allOpen && wrist.y < raisedThreshold) {
      return {
        gesture: 'RAISED_PALM',
        shotName: 'LOFTED_SHOT',
        confidence: 0.96,
        isAction: true,
        velocity,
        fingers: fingersState,
        description: 'Lofted drive high into the stands (Sixer!)'
      };
    }

    // 3. Detect Closed Fist (Leave Ball)
    if (allCurled) {
      return {
        gesture: 'CLOSED_FIST',
        shotName: 'LEAVE_BALL',
        confidence: 0.94,
        isAction: true,
        velocity,
        fingers: fingersState,
        description: 'Shouldering arms — Leave outside off'
      };
    }

    // 4. Detect Open Palm at regular chest/waist height (Defensive Shot)
    if (allOpen && wrist.y >= raisedThreshold) {
      return {
        gesture: 'OPEN_PALM',
        shotName: 'DEFENSIVE_SHOT',
        confidence: 0.92,
        isAction: true,
        velocity,
        fingers: fingersState,
        description: 'Forward defensive block with soft hands'
      };
    }

    // Stance / Neutral
    return {
      gesture: 'NEUTRAL',
      shotName: 'READY_STANCE',
      confidence: 0.60,
      isAction: false,
      velocity,
      fingers: fingersState,
      description: 'At the crease: Waiting for delivery'
    };
  }

  reset() {
    this.prevWrist = null;
    this.prevTime = null;
    this.wristVelocity = { vx: 0, vy: 0 };
    this.trajectoryBuffer = [];
  }
}
