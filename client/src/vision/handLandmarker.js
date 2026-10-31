/**
 * handLandmarker.js
 * MediaPipe Tasks Vision HandLandmarker integration.
 * Manages webcam lifecycle, landmark inference, canvas skeleton drawing, and FPS tracking.
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const LOCAL_MODEL_PATH = '/models/hand_landmarker.task';
const CDN_MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const WASM_CDN_PATH =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

// Hand landmark connectivity for skeleton rendering
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [0, 17]
];

export class VisionPipeline {
  constructor() {
    this.landmarker = null;
    this.videoElement = null;
    this.isRunning = false;
    this.lastVideoTime = -1;
    this.fps = 0;
    this.latencyMs = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
  }

  async initialize() {
    if (this.landmarker) return true;

    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN_PATH);

      // Try local model first; fallback to CDN if not downloaded yet
      let modelAssetPath = LOCAL_MODEL_PATH;
      try {
        const check = await fetch(LOCAL_MODEL_PATH, { method: 'HEAD' });
        if (!check.ok) modelAssetPath = CDN_MODEL_PATH;
      } catch (e) {
        modelAssetPath = CDN_MODEL_PATH;
      }

      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath,
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      return true;
    } catch (err) {
      console.warn('[VisionPipeline] Failed to load GPU landmarker, retrying with CPU:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN_PATH);
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: CDN_MODEL_PATH,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 1
        });
        return true;
      } catch (cpuErr) {
        console.error('[VisionPipeline] HandLandmarker initialization failed:', cpuErr);
        return false;
      }
    }
  }

  async startCamera(videoElement) {
    this.videoElement = videoElement;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam API is not supported in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    });

    this.videoElement.srcObject = stream;
    await new Promise((resolve) => {
      this.videoElement.onloadedmetadata = () => {
        this.videoElement.play();
        this.isRunning = true;
        resolve();
      };
    });
  }

  stopCamera() {
    this.isRunning = false;
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
  }

  detectFrame() {
    if (!this.isRunning || !this.landmarker || !this.videoElement) {
      return null;
    }

    const startTime = performance.now();
    const currentTime = this.videoElement.currentTime;

    if (currentTime !== this.lastVideoTime) {
      this.lastVideoTime = currentTime;
      const result = this.landmarker.detectForVideo(this.videoElement, startTime);

      // FPS and latency tracking
      this.latencyMs = Math.round(performance.now() - startTime);
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsUpdate >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }

      const landmarks = result.landmarks && result.landmarks[0] ? result.landmarks[0] : null;
      return {
        landmarks,
        fps: this.fps,
        latencyMs: this.latencyMs
      };
    }

    return null;
  }

  drawSkeleton(ctx, landmarks, width, height) {
    if (!ctx || !landmarks || landmarks.length < 21) return;

    ctx.clearRect(0, 0, width, height);

    // Draw skeleton bone connections
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.75)'; // Electric Lime

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }

    // Draw landmark joints
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const x = p.x * width;
      const y = p.y * height;

      ctx.beginPath();
      ctx.arc(x, y, i === 0 ? 6 : 4, 0, 2 * Math.PI);
      if (i === 0) {
        ctx.fillStyle = '#f43f5e'; // Wrist root in coral
      } else if ([4, 8, 12, 16, 20].includes(i)) {
        ctx.fillStyle = '#06b6d4'; // Finger tips in cyan
      } else {
        ctx.fillStyle = '#a3e635'; // Joints in lime
      }
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  }
}
