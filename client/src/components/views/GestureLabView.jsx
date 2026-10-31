/**
 * GestureLabView.jsx
 * Advanced Computer Vision Testing Lab for MediaPipe Hand Landmarker.
 * Visualizes 21 3D landmarks, confidence scores, FPS, calibration controls,
 * finger sensor telemetry, interactive 5-shot mastery challenge, and gesture event stream.
 */

import React, { useState, useEffect, useRef } from 'react';
import { VisionPipeline } from '../../vision/handLandmarker';
import { CricketGestureRecognizer } from '../../vision/gestureRecognition';
import { LandmarkSmoother, GestureDebouncer } from '../../vision/smoothing';
import { HandCalibrationManager } from '../../vision/calibration';
import { 
  Camera, 
  CameraOff, 
  Sliders, 
  RotateCcw, 
  CheckCircle, 
  Activity, 
  Sparkles,
  Award,
  Zap,
  Info
} from 'lucide-react';

export default function GestureLabView() {
  const [cameraActive, setCameraActive] = useState(false);
  const [visionReady, setVisionReady] = useState(false);
  const [activeGesture, setActiveGesture] = useState('NEUTRAL');
  const [gestureDetails, setGestureDetails] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [fps, setFps] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibratedProfile, setCalibratedProfile] = useState(null);
  const [gestureHistory, setGestureHistory] = useState([]);
  const [sensitivity, setSensitivityState] = useState('HIGH');

  // Interactive 5-Shot Mastery Checklist Tracker
  const [masteredShots, setMasteredShots] = useState({
    OPEN_PALM: false,
    SWIPE_LEFT: false,
    SWIPE_RIGHT: false,
    RAISED_PALM: false,
    CLOSED_FIST: false
  });

  // Pipeline Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const pipelineRef = useRef(null);
  const recognizerRef = useRef(null);
  const smootherRef = useRef(null);
  const debouncerRef = useRef(null);
  const calibrationRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    pipelineRef.current = new VisionPipeline();
    calibrationRef.current = new HandCalibrationManager();
    recognizerRef.current = new CricketGestureRecognizer(calibrationRef.current.getProfile());
    recognizerRef.current.setSensitivity('HIGH');
    smootherRef.current = new LandmarkSmoother(0.35);
    debouncerRef.current = new GestureDebouncer(3, 350);

    pipelineRef.current.initialize().then((ready) => {
      setVisionReady(ready);
      setCalibratedProfile(calibrationRef.current.getProfile());
    });

    return () => {
      if (pipelineRef.current) pipelineRef.current.stopCamera();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleSensitivityChange = (mode) => {
    setSensitivityState(mode);
    if (recognizerRef.current) {
      recognizerRef.current.setSensitivity(mode);
    }
  };

  const toggleCamera = async () => {
    if (cameraActive) {
      if (pipelineRef.current) pipelineRef.current.stopCamera();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setCameraActive(false);
      setActiveGesture('NEUTRAL');
      setGestureDetails(null);
    } else {
      try {
        await pipelineRef.current.startCamera(videoRef.current);
        setCameraActive(true);
        startVisionLoop();
      } catch (err) {
        alert('Could not start webcam: ' + err.message);
      }
    }
  };

  const startVisionLoop = () => {
    const loop = () => {
      if (!pipelineRef.current || !pipelineRef.current.isRunning) return;

      const frameData = pipelineRef.current.detectFrame();
      if (frameData) {
        setFps(frameData.fps);
        setLatencyMs(frameData.latencyMs);

        if (frameData.landmarks) {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            pipelineRef.current.drawSkeleton(ctx, frameData.landmarks, canvas.width, canvas.height);
          }

          // Calibration Step
          if (calibrationRef.current && isCalibrating) {
            const complete = calibrationRef.current.addSample(frameData.landmarks);
            const count = calibrationRef.current.calibrationSamples.length;
            setCalibrationProgress(Math.round((count / calibrationRef.current.targetSamples) * 100));
            if (complete) {
              setIsCalibrating(false);
              const p = calibrationRef.current.getProfile();
              setCalibratedProfile(p);
              recognizerRef.current.updateProfile(p);
            }
          }

          // Smoothing
          const smoothed = smootherRef.current.smooth(frameData.landmarks);

          // Classification
          const result = recognizerRef.current.classify(smoothed);
          setGestureDetails(result);

          // Debounce
          const debounced = debouncerRef.current.push(result.gesture, result.confidence);
          setActiveGesture(debounced.activeGesture);
          const confScore = Math.round(debounced.confidence * 100);
          setConfidence(confScore);

          // Mark shot in mastery checklist
          if (debounced.activeGesture && debounced.activeGesture !== 'NEUTRAL') {
            setMasteredShots(prev => ({
              ...prev,
              [debounced.activeGesture]: true
            }));
          }

          if (debounced.isTriggerable) {
            setGestureHistory((prev) => [
              {
                id: Date.now(),
                gesture: debounced.activeGesture,
                confidence: confScore,
                timestamp: new Date().toLocaleTimeString()
              },
              ...prev.slice(0, 14)
            ]);
          }
        } else {
          setActiveGesture('NEUTRAL');
          setGestureDetails(null);
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const handleStartCalibration = () => {
    if (!cameraActive) {
      alert('Please start the camera before calibrating!');
      return;
    }
    calibrationRef.current.startCalibration();
    setIsCalibrating(true);
    setCalibrationProgress(0);
  };

  const handleResetCalibration = () => {
    calibrationRef.current.reset();
    setCalibratedProfile(calibrationRef.current.getProfile());
    recognizerRef.current.updateProfile(calibrationRef.current.getProfile());
    setCalibrationProgress(0);
    setIsCalibrating(false);
  };

  const masteryCount = Object.values(masteredShots).filter(Boolean).length;
  const fingers = gestureDetails?.fingers || {
    thumb: false, index: false, middle: false, ring: false, pinky: false
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-lime-400">Computer Vision Workbench</span>
          <h1 className="text-3xl font-black font-display text-white">MediaPipe Gesture Lab</h1>
          <p className="text-sm text-slate-400">
            Real-time 21 hand landmark extraction, kinematic velocity calculations, and interactive gesture calibration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sensitivity Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="px-2 text-slate-400 font-bold text-[10px] uppercase">Sensitivity:</span>
            {['NORMAL', 'HIGH', 'ULTRA'].map(s => (
              <button
                key={s}
                onClick={() => handleSensitivityChange(s)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  sensitivity === s
                    ? 'bg-lime-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={toggleCamera}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all ${
              cameraActive
                ? 'bg-rose-950 border border-rose-600 text-rose-300'
                : 'bg-lime-400 hover:bg-lime-300 text-slate-950'
            }`}
          >
            {cameraActive ? 'Stop Camera' : 'Start Camera Feed'}
          </button>
        </div>
      </div>

      {/* 5-Shot Gesture Mastery Progress Bar */}
      <div className="glass-card p-5 border-l-4 border-l-lime-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-lime-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Cricket Shot Mastery: {masteryCount}/5 Gestures Verified
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Hold each gesture in view to calibrate and confirm your batting stroke readiness before heading to the arena.
          </p>
        </div>

        {/* Badges for each shot */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'OPEN_PALM', label: 'Defend (✋)' },
            { key: 'SWIPE_LEFT', label: 'Leg Flick (👈)' },
            { key: 'SWIPE_RIGHT', label: 'Off Drive (👉)' },
            { key: 'RAISED_PALM', label: 'Lofted Six (🙌)' },
            { key: 'CLOSED_FIST', label: 'Leave Ball (✊)' }
          ].map(s => (
            <div
              key={s.key}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                masteredShots[s.key]
                  ? 'bg-lime-950/80 border-lime-400 text-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.3)]'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${masteredShots[s.key] ? 'bg-lime-400' : 'bg-slate-600'}`} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live Visualizer & Skeleton (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-lime-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  21 Landmark Skeleton View
                </span>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">FPS: <strong className="text-lime-400">{fps}</strong></span>
                <span className="text-slate-400">Latency: <strong className="text-cyan-400">{latencyMs}ms</strong></span>
              </div>
            </div>

            {/* Video & Skeleton Canvas */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none ${cameraActive ? 'block' : 'hidden'}`}
              />

              {!cameraActive && (
                <div className="flex flex-col items-center gap-3 text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <CameraOff className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Camera Standby</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Activate your webcam to test the MediaPipe Hand Landmarker model and view real-time bone joint coordinates.
                  </p>
                </div>
              )}

              {/* Calibration Progress Bar Overlay */}
              {isCalibrating && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur flex flex-col items-center justify-center p-6 space-y-3 z-20">
                  <Sliders className="w-8 h-8 text-lime-400 animate-spin" />
                  <h4 className="text-base font-bold text-white">Calibrating Hand Geometry...</h4>
                  <p className="text-xs text-slate-400">Hold your hand steady in your normal batting stance</p>
                  <div className="w-64 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-lime-400 transition-all duration-150"
                      style={{ width: `${calibrationProgress}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-lime-400 font-bold">{calibrationProgress}%</span>
                </div>
              )}
            </div>

            {/* Live Finger Sensor Status & Kinematic Velocity */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Finger Sensor Telemetry</span>
                <span className="font-mono text-slate-400">
                  Vx: <strong className="text-cyan-400">{gestureDetails?.velocity?.vx?.toFixed(2) || '0.00'}</strong> | 
                  Vy: <strong className="text-cyan-400">{gestureDetails?.velocity?.vy?.toFixed(2) || '0.00'}</strong>
                </span>
              </div>

              {/* Individual Finger Sensors */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {[
                  { name: 'Thumb', active: fingers.thumb },
                  { name: 'Index', active: fingers.index },
                  { name: 'Middle', active: fingers.middle },
                  { name: 'Ring', active: fingers.ring },
                  { name: 'Pinky', active: fingers.pinky }
                ].map(f => (
                  <div
                    key={f.name}
                    className={`py-2 rounded-lg border transition-all ${
                      f.active
                        ? 'bg-lime-950/80 border-lime-400 text-lime-300 font-bold shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="text-[10px] uppercase block">{f.name}</span>
                    <span className="text-xs font-mono">{f.active ? 'EXTENDED' : 'CURLED'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Classification Gauge Bar */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Classified Gesture</span>
                <span className="text-2xl font-black font-display text-lime-400">
                  {activeGesture.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  {gestureDetails?.description || 'Waiting for hand'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Match Confidence</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-lime-500 to-emerald-400 transition-all duration-200"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold text-white">{confidence}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calibration Profile Manager */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Calibration Profile</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartCalibration}
                  disabled={!cameraActive || isCalibrating}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Sliders className="w-3 h-3" />
                  <span>{calibratedProfile?.isCalibrated ? 'Recalibrate' : 'Calibrate Stance'}</span>
                </button>
                <button
                  onClick={handleResetCalibration}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Resting Wrist Y:</span>
                <strong className="text-white text-sm">{calibratedProfile?.wristRestY?.toFixed(3) || '0.650'}</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Palm Scale:</span>
                <strong className="text-white text-sm">{calibratedProfile?.palmScale?.toFixed(3) || '0.150'}</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Swipe Threshold:</span>
                <strong className="text-lime-400 text-sm">{calibratedProfile?.swipeThresholdX?.toFixed(3) || '0.320'}</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Raised Threshold:</span>
                <strong className="text-purple-400 text-sm">{calibratedProfile?.raisedThresholdY?.toFixed(3) || '0.380'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Gesture Stream & Reference Guide (1 col) */}
        <div className="space-y-6">
          {/* Live Gesture Stream Log */}
          <div className="glass-card p-5 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gesture Event Stream</span>
            <div className="h-56 overflow-y-auto space-y-2 pr-1">
              {gestureHistory.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-4 text-center">
                  Trigger hand gestures to view timestamped classification events
                </div>
              ) : (
                gestureHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs animate-fadeIn"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-lime-400" />
                      <span className="font-bold text-slate-200">{item.gesture.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-lime-400 font-bold">{item.confidence}%</span>
                      <span className="text-slate-400">{item.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cricket Gesture Reference Guide with Visual Pose Icons */}
          <div className="glass-card p-5 space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Batting Gesture Reference Guide</span>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-lime-400">✋ OPEN PALM</strong>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Defensive Shot</span>
                </div>
                <p className="text-slate-400">All 5 fingers extended facing webcam at chest height. Executes straight-bat defensive block.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-cyan-400">👈 SWIPE LEFT</strong>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Leg-Side Flick</span>
                </div>
                <p className="text-slate-400">Rapid horizontal leftward wrist sweep. Flicks the ball square or fine through midwicket.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-cyan-400">👉 SWIPE RIGHT</strong>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Off-Side Drive</span>
                </div>
                <p className="text-slate-400">Rapid horizontal rightward sweep. Punches the ball past cover or through point for FOUR.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-purple-400">🙌 RAISED OPEN PALM</strong>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Lofted Shot (6)</span>
                </div>
                <p className="text-slate-400">Open palm raised high above shoulder height. Power launch over long-on / long-off into the crowd!</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-amber-400">✊ CLOSED FIST</strong>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Leave Ball</span>
                </div>
                <p className="text-slate-400">Tightly clenched fist. Shoulders arms to let dangerous swinging deliveries pass to the keeper.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
