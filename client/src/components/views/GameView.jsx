/**
 * GameView.jsx
 * Interactive 3D Cricket Play Arena with live MediaPipe webcam gesture recognition,
 * deterministic scoreboard, match controls, and real-time AI commentary.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import CricketArena from '../../game/CricketArena';
import { createInitialMatchState, recordDelivery, computeSummaryMetrics } from '../../game/gameState';
import { VisionPipeline } from '../../vision/handLandmarker';
import { CricketGestureRecognizer } from '../../vision/gestureRecognition';
import { LandmarkSmoother, GestureDebouncer } from '../../vision/smoothing';
import { HandCalibrationManager } from '../../vision/calibration';
import { generateCommentary } from '../../services/api';
import { 
  Camera, 
  CameraOff, 
  RotateCcw, 
  Play, 
  Award, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  Info,
  Sliders
} from 'lucide-react';

export default function GameView({ matchState, setMatchState, setActiveTab }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [visionReady, setVisionReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [activeGesture, setActiveGesture] = useState('NEUTRAL');
  const [gestureConfidence, setGestureConfidence] = useState(0);
  const [fps, setFps] = useState(0);
  const [sensitivity, setSensitivity] = useState('HIGH');
  const [latestCommentary, setLatestCommentary] = useState({
    text: "Welcome to the CricketVerse Arena! Set your stance and bowl the first ball.",
    provider: "cricket-broadcast-system",
    isFallback: false
  });

  // Vision Pipeline Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const pipelineRef = useRef(null);
  const recognizerRef = useRef(null);
  const smootherRef = useRef(null);
  const debouncerRef = useRef(null);
  const calibrationRef = useRef(null);
  const animFrameRef = useRef(null);

  // Initialize Vision Pipeline on Mount
  useEffect(() => {
    pipelineRef.current = new VisionPipeline();
    calibrationRef.current = new HandCalibrationManager();
    recognizerRef.current = new CricketGestureRecognizer(calibrationRef.current.getProfile());
    recognizerRef.current.setSensitivity('HIGH');
    smootherRef.current = new LandmarkSmoother(0.35);
    debouncerRef.current = new GestureDebouncer(3, 350);

    pipelineRef.current.initialize().then((ready) => {
      setVisionReady(ready);
    }).catch(err => {
      console.warn('Vision pipeline error:', err);
    });

    return () => {
      if (pipelineRef.current) pipelineRef.current.stopCamera();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleSensitivityChange = (mode) => {
    setSensitivity(mode);
    if (recognizerRef.current) {
      recognizerRef.current.setSensitivity(mode);
    }
  };

  // Camera toggle handler
  const toggleCamera = async () => {
    if (cameraActive) {
      if (pipelineRef.current) pipelineRef.current.stopCamera();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setCameraActive(false);
      setActiveGesture('NEUTRAL');
    } else {
      setCameraError(null);
      try {
        await pipelineRef.current.startCamera(videoRef.current);
        setCameraActive(true);
        startVisionLoop();
      } catch (err) {
        console.error('Failed to start camera:', err);
        setCameraError(err.message || 'Unable to access webcam. You can still play with keyboard keys!');
      }
    }
  };

  // Real-time Computer Vision Loop
  const startVisionLoop = () => {
    const loop = () => {
      if (!pipelineRef.current || !pipelineRef.current.isRunning) return;

      const frameData = pipelineRef.current.detectFrame();
      if (frameData) {
        setFps(frameData.fps);

        if (frameData.landmarks) {
          // Draw skeleton on canvas overlay
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            pipelineRef.current.drawSkeleton(ctx, frameData.landmarks, canvas.width, canvas.height);
          }

          // Smooth landmarks
          const smoothed = smootherRef.current.smooth(frameData.landmarks);

          // Classify cricket shot
          const rawClassification = recognizerRef.current.classify(smoothed);

          // Debounce to prevent duplicates
          const debounced = debouncerRef.current.push(
            rawClassification.gesture,
            rawClassification.confidence
          );

          setActiveGesture(debounced.activeGesture);
          setGestureConfidence(Math.round(debounced.confidence * 100));
        } else {
          // No hand detected
          setActiveGesture('NEUTRAL');
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

  // Ball Completion Handler (connected to 3D Arena)
  const handleBallComplete = useCallback(async (ballResult) => {
    setMatchState((prevState) => {
      const nextState = recordDelivery(prevState, ballResult);

      // Async trigger AI Commentary via API
      generateCommentary(
        ballResult.eventType,
        ballResult.runs,
        ballResult.shotTypeKey,
        {
          score: nextState.runs,
          wickets: nextState.wickets,
          overs: `${Math.floor(nextState.balls / 6)}.${nextState.balls % 6}`,
          target: nextState.target
        }
      ).then((res) => {
        if (res && res.commentary) {
          setLatestCommentary({
            text: res.commentary,
            provider: res.provider,
            isFallback: res.is_fallback
          });
        }
      }).catch((err) => {
        console.warn('Commentary error:', err);
      });

      return nextState;
    });
  }, [setMatchState]);

  // Match Reset Handler
  const handleResetMatch = (overs = 2, target = 30) => {
    setMatchState(createInitialMatchState(overs, target));
    setLatestCommentary({
      text: `Match initialized! Chasing ${target} runs in ${overs} overs. Play your shots!`,
      provider: "cricket-broadcast-system",
      isFallback: false
    });
  };

  const metrics = computeSummaryMetrics(matchState);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Top Banner: Scoreboard & Match Stats */}
      <div className="glass-card p-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 items-center">
        {/* Score & Wickets */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Score / Wickets</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-display text-white">{matchState.runs}</span>
            <span className="text-xl font-bold text-rose-400">/{matchState.wickets}</span>
          </div>
        </div>

        {/* Overs */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Overs</span>
          <span className="text-2xl font-bold font-display text-lime-400">
            {metrics.oversFormatted} <span className="text-xs text-slate-400 font-normal">/ {matchState.oversLimit}.0</span>
          </span>
        </div>

        {/* Target */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Target</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-white">{matchState.target}</span>
            <span className="text-xs text-amber-400 font-semibold">({metrics.runsNeeded} needed)</span>
          </div>
        </div>

        {/* Strike Rate */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Strike Rate</span>
          <span className="text-2xl font-bold font-display text-cyan-400">{metrics.strikeRate}</span>
        </div>

        {/* Run Rate */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Current / Req RR</span>
          <span className="text-lg font-bold font-display text-slate-200">
            {metrics.currentRunRate} <span className="text-xs text-slate-400">/ {metrics.requiredRunRate}</span>
          </span>
        </div>

        {/* Boundaries */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Boundaries</span>
          <span className="text-lg font-bold font-display text-slate-200">
            <span className="text-lime-400">{matchState.fours}</span> fours, <span className="text-purple-400">{matchState.sixes}</span> sixes
          </span>
        </div>

        {/* Match Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleResetMatch(matchState.oversLimit, matchState.target)}
            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
            title="Reset match statistics"
          >
            <RotateCcw className="w-3.5 h-3.5 text-lime-400" />
            <span>Reset Match</span>
          </button>
        </div>
      </div>

      {/* Match Result Banner (If Completed) */}
      {matchState.status === 'COMPLETED' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-lime-950/80 border border-lime-400/50 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lime-400 text-slate-950 flex items-center justify-center font-bold">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black font-display text-white">{matchState.resultMessage}</h3>
              <p className="text-xs text-slate-300">Innings completed. Study your technical postmortem with Gemma 4!</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('coach')}
            className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open AI Tactical Coach</span>
          </button>
        </div>
      )}

      {/* Main Playing Grid: 3D Arena (Left) & Live Webcam HUD + Shot History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Three.js Cricket Arena (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <CricketArena
            activeGesture={activeGesture}
            onBallComplete={handleBallComplete}
            isMatchActive={matchState.status !== 'COMPLETED'}
          />

          {/* Live AI Commentary Ticker */}
          <div className="glass-card px-5 py-3.5 flex items-center gap-3 border-l-4 border-l-lime-400">
            <Volume2 className="w-5 h-5 text-lime-400 shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-100">{latestCommentary.text}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
              latestCommentary.isFallback
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : 'bg-purple-950/60 border-purple-500/40 text-purple-300'
            }`}>
              {latestCommentary.provider}
            </span>
          </div>

          {/* Ball Timeline Tracker */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Recent Balls:</span>
            {matchState.timeline.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No balls bowled yet in this innings</span>
            ) : (
              matchState.timeline.slice(-12).map((item, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-black text-xs shrink-0 border ${
                    item.isWicket
                      ? 'bg-rose-950 border-rose-500 text-rose-200'
                      : item.runs === 6
                      ? 'bg-purple-950 border-purple-400 text-purple-200'
                      : item.runs === 4
                      ? 'bg-lime-950 border-lime-400 text-lime-200'
                      : item.runs === 0
                      ? 'bg-slate-900 border-slate-700 text-slate-400'
                      : 'bg-cyan-950 border-cyan-500 text-cyan-200'
                  }`}
                  title={`Ball ${item.ballNumber}: ${item.runs} runs (${item.timing})`}
                >
                  {item.isWicket ? 'W' : item.runs}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side Panel: Camera HUD & Gesture Guide (1 col) */}
        <div className="space-y-4">
          {/* Live Webcam HUD Card */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-lime-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Webcam HUD</span>
              </div>
              <button
                onClick={toggleCamera}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  cameraActive
                    ? 'bg-rose-950 border border-rose-600 text-rose-300'
                    : 'bg-lime-400 text-slate-950 hover:bg-lime-300'
                }`}
              >
                {cameraActive ? 'Stop Cam' : 'Start Cam'}
              </button>
            </div>

            {/* Video & Skeleton Canvas Container */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
              />
              <canvas
                ref={canvasRef}
                width={320}
                height={240}
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none ${cameraActive ? 'block' : 'hidden'}`}
              />

              {!cameraActive && (
                <div className="flex flex-col items-center gap-2 p-4 text-center">
                  <CameraOff className="w-8 h-8 text-slate-600" />
                  <p className="text-xs text-slate-400">
                    Camera inactive. Click 'Start Cam' to play with hand gestures, or use keyboard keys!
                  </p>
                </div>
              )}

              {cameraActive && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-lime-400 border border-slate-800">
                  {fps} FPS
                </div>
              )}
            </div>

            {/* Detected Gesture Feedback Badge */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Active Shot Gesture:</span>
                <span className="font-bold text-lime-400">{gestureConfidence}% match</span>
              </div>
              <div className="text-base font-black font-display text-white">
                {activeGesture.replace('_', ' ')}
              </div>

              {/* Sensitivity selector */}
              <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-800">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Sensitivity:</span>
                <div className="flex gap-1">
                  {['NORMAL', 'HIGH', 'ULTRA'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleSensitivityChange(s)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sensitivity === s
                          ? 'bg-lime-400 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {cameraError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-[11px] text-rose-300">
                {cameraError}
              </div>
            )}
          </div>

          {/* Cricket Gesture Quick Legend */}
          <div className="glass-card p-4 space-y-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Shot Gesture Map</span>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">✋ Open Palm</span>
                <span className="font-bold text-lime-400">Defensive</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">👈 Swipe Left</span>
                <span className="font-bold text-cyan-400">Leg-Side</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">👉 Swipe Right</span>
                <span className="font-bold text-cyan-400">Off-Side</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">🙌 High Palm</span>
                <span className="font-bold text-purple-400">Lofted 6</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">✊ Closed Fist</span>
                <span className="font-bold text-amber-400">Leave Ball</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
