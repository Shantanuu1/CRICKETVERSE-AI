/**
 * calibration.js
 * Manages hand tracking calibration, resting baseline coordinates,
 * and adaptive movement thresholds based on user distance and hand geometry.
 */

export class HandCalibrationManager {
  constructor() {
    this.isCalibrated = false;
    this.calibrationSamples = [];
    this.targetSamples = 30; // ~1 second at 30fps

    this.profile = {
      wristRestY: 0.65,
      palmScale: 0.15,
      swipeThresholdX: 0.08,
      raisedThresholdY: 0.35,
      fistThreshold: 0.40
    };
  }

  startCalibration() {
    this.isCalibrated = false;
    this.calibrationSamples = [];
  }

  addSample(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;

    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const dx = middleMcp.x - wrist.x;
    const dy = middleMcp.y - wrist.y;
    const palmDist = Math.sqrt(dx * dx + dy * dy);

    this.calibrationSamples.push({
      wristY: wrist.y,
      palmDist
    });

    if (this.calibrationSamples.length >= this.targetSamples) {
      this._finalizeCalibration();
      return true; // calibration complete
    }

    return false;
  }

  _finalizeCalibration() {
    const avgWristY =
      this.calibrationSamples.reduce((acc, s) => acc + s.wristY, 0) /
      this.calibrationSamples.length;
    const avgPalmDist =
      this.calibrationSamples.reduce((acc, s) => acc + s.palmDist, 0) /
      this.calibrationSamples.length;

    this.profile.wristRestY = avgWristY;
    this.profile.palmScale = avgPalmDist;
    // Set raised palm threshold higher than resting position by 0.25 (remember lower Y is higher on screen)
    this.profile.raisedThresholdY = Math.max(0.2, avgWristY - 0.22);
    this.profile.swipeThresholdX = Math.max(0.06, avgPalmDist * 0.55);

    this.isCalibrated = true;
  }

  getProfile() {
    return { ...this.profile, isCalibrated: this.isCalibrated };
  }

  reset() {
    this.isCalibrated = false;
    this.calibrationSamples = [];
    this.profile = {
      wristRestY: 0.65,
      palmScale: 0.15,
      swipeThresholdX: 0.08,
      raisedThresholdY: 0.35,
      fistThreshold: 0.40
    };
  }
}
