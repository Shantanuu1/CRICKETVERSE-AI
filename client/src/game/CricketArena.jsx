/**
 * CricketArena.jsx
 * Advanced 3D Three.js Cricket Gaming Environment.
 * 
 * Graphical Enhancements:
 * - Alternating mowed lawn outfield striping (Lord's / MCG turf pattern)
 * - LED Zing bails and wickets with flashing red wicket reaction
 * - Modern 360-degree LED stadium advertising ribbons
 * - 4 Corner stadium floodlight towers with glowing light clusters
 * - White sight screens at both ends of the ground
 * - Hawkeye ball trajectory tracer & pitch impact markers
 * - Bat impact spark particles and celebratory crowd cheer
 * - Dynamic hit-timing zone visualizer ("SWING NOW!")
 * - Interactive live gesture status badges
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BatsmanEntity } from './Batsman';
import { BowlerEntity } from './Bowler';
import { CricketBallEntity } from './Ball';
import { calculateBallResult } from './scoring';

// Web Audio API Sound Synthesizer (Zero external audio assets needed)
class SoundSynthesizer {
  constructor() {
    this.ctx = null;
  }

  _init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBatCrack() {
    this._init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Resonant woody willow impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);

    // High frequency snap
    const snap = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snap.type = 'sawtooth';
    snap.frequency.setValueAtTime(1400, now);
    snap.frequency.exponentialRampToValueAtTime(220, now + 0.05);
    snapGain.gain.setValueAtTime(0.6, now);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    snap.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snap.start(now);
    snap.stop(now + 0.06);
  }

  playStumpClash() {
    this._init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.38);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.39);
  }

  playCrowdCheer() {
    this._init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 1.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.98 * b1 + white * 0.05;
      b2 = 0.97 * b2 + white * 0.05;
      data[i] = (b0 + b1 + b2) * 0.45;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(520, now);
    filter.Q.setValueAtTime(1.1, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 1.6);
  }
}

const sounds = new SoundSynthesizer();

export default function CricketArena({
  activeGesture = 'NEUTRAL',
  onBallComplete,
  isMatchActive = true,
  autoBowlInterval = 4800
}) {
  const containerRef = useRef(null);
  const [bowlerState, setBowlerState] = useState('READY'); // READY, RUNUP, DELIVERED, HIT
  const [lastShotFeedback, setLastShotFeedback] = useState(null);
  const [cameraMode, setCameraMode] = useState('BATTER'); // BATTER, BROADCAST, BOWLER
  const [timingIndicator, setTimingIndicator] = useState({ text: 'READY', color: 'slate' });

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const batsmanRef = useRef(null);
  const bowlerRef = useRef(null);
  const ballRef = useRef(null);
  const bailsRef = useRef([]);
  const stumpsRef = useRef([]);
  const animFrameRef = useRef(null);
  const ballInFlightRef = useRef(false);
  const hasHitBallRef = useRef(false);
  const lastGestureRef = useRef(activeGesture);
  const cameraShakeRef = useRef(0);

  useEffect(() => {
    lastGestureRef.current = activeGesture;
  }, [activeGesture]);

  // Setup Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // Scene & Dark Stadium Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913); // Deep stadium midnight navy
    scene.fog = new THREE.FogExp2(0x060913, 0.012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 260);
    camera.position.set(0, 3.6, -13.5);
    camera.lookAt(0, 1.8, 4);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.65);
    scene.add(ambientLight);

    // Dynamic Stadium Floodlights
    const mainFloodlight = new THREE.DirectionalLight(0xf8fafc, 1.4);
    mainFloodlight.position.set(22, 36, 18);
    mainFloodlight.castShadow = true;
    mainFloodlight.shadow.mapSize.width = 1024;
    mainFloodlight.shadow.mapSize.height = 1024;
    scene.add(mainFloodlight);

    const fillFloodlight = new THREE.DirectionalLight(0xa3e635, 0.85); // Lime halo
    fillFloodlight.position.set(-22, 32, -18);
    scene.add(fillFloodlight);

    const purpleSpot = new THREE.DirectionalLight(0x818cf8, 0.6); // Purple rim
    purpleSpot.position.set(0, 24, -30);
    scene.add(purpleSpot);

    // 1. Alternating Mowed Grass Outfield (Striped Lawn Rings)
    const outfieldGroup = new THREE.Group();
    const ringRadii = [56, 46, 36, 26, 16];
    const grassColors = [0x15803d, 0x166534, 0x15803d, 0x166534, 0x14532d];

    ringRadii.forEach((rad, idx) => {
      const ringGeo = new THREE.CylinderGeometry(rad, rad, 0.18, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: grassColors[idx % grassColors.length],
        roughness: 0.85
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = -0.09 + idx * 0.002;
      ring.receiveShadow = true;
      outfieldGroup.add(ring);
    });
    scene.add(outfieldGroup);

    // 2. Mowed 22-Yard Cricket Pitch with Wear Texture
    const pitchGeo = new THREE.BoxGeometry(3.6, 0.22, 22.4);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0xc8ad7f, // Clay beige
      roughness: 0.95
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.position.set(0, -0.04, 0);
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Crease Markings (Popping, Bowling & Return Creases)
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Batting popping crease
    const batPopping = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.23, 0.12), whiteLineMat);
    batPopping.position.set(0, -0.03, -8);
    scene.add(batPopping);

    // Bowling popping crease
    const bowlPopping = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.23, 0.12), whiteLineMat);
    bowlPopping.position.set(0, -0.03, 10);
    scene.add(bowlPopping);

    // Return creases (Side boundaries of wicket)
    [-1.5, 1.5].forEach(xPos => {
      const returnCrease = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.23, 2.4), whiteLineMat);
      returnCrease.position.set(xPos, -0.03, -8);
      scene.add(returnCrease);
    });

    // 3. Boundary Rope with Cushioned Foam Wedges
    const ropeGeo = new THREE.TorusGeometry(48, 0.38, 10, 64);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 0.22;
    scene.add(rope);

    // 4. LED Glowing Advertising Perimeter Ribbons (Neo-brutalist Billboards)
    const ribbonGeo = new THREE.CylinderGeometry(51, 51, 1.6, 48, 1, true);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      emissive: 0x1e293b,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide
    });
    const adRibbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    adRibbon.position.y = 0.9;
    scene.add(adRibbon);

    // Glowing Neon Accent Strips on Boundary
    const neonTopRing = new THREE.TorusGeometry(51, 0.08, 6, 64);
    const neonTopMat = new THREE.MeshBasicMaterial({ color: 0xa3e635 }); // Electric lime neon
    const neonTop = new THREE.Mesh(neonTopRing, neonTopMat);
    neonTop.rotation.x = Math.PI / 2;
    neonTop.position.y = 1.7;
    scene.add(neonTop);

    // 5. Grandstand Stadium Tiers with Spectator Ambient Glow
    const standGeo = new THREE.CylinderGeometry(66, 54, 12, 48, 1, true);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      roughness: 0.9,
      side: THREE.BackSide
    });
    const grandstand = new THREE.Mesh(standGeo, standMat);
    grandstand.position.y = 6.2;
    scene.add(grandstand);

    // 6. Sight Screens (Batting & Bowling Ends)
    [-1, 1].forEach(dir => {
      const screenGeo = new THREE.BoxGeometry(6.5, 4.0, 0.3);
      const screenMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 2.2, dir * 42);
      scene.add(screen);
    });

    // 7. Corner Floodlight Towers (4 High-Mast Lighting Rigs)
    const towerCoords = [
      [36, 36], [-36, 36], [36, -36], [-36, -36]
    ];
    towerCoords.forEach(([tx, tz]) => {
      const mastGeo = new THREE.CylinderGeometry(0.3, 0.6, 28, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(tx, 14, tz);
      scene.add(mast);

      // Light pod array (Glowing grid)
      const podGeo = new THREE.BoxGeometry(3.5, 2.2, 0.8);
      const podMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfef08a,
        emissiveIntensity: 1.5
      });
      const pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(tx, 28, tz);
      pod.lookAt(0, 0, 0);
      scene.add(pod);
    });

    // 8. High-Tech Zing LED Stumps & Bails (Batting End at Z = -8.8)
    const stumpMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.3,
      emissive: 0x000000,
      emissiveIntensity: 0.0
    });
    const stumpGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.15, 12);
    stumpsRef.current = [];

    [-0.15, 0, 0.15].forEach(xOffset => {
      const stump = new THREE.Mesh(stumpGeo, stumpMat.clone());
      stump.position.set(xOffset, 0.58, -8.8);
      stump.castShadow = true;
      scene.add(stump);
      stumpsRef.current.push(stump);
    });

    // Zing Bails
    const bailGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.19, 8);
    bailsRef.current = [];
    [-0.08, 0.08].forEach(xOffset => {
      const bail = new THREE.Mesh(bailGeo, stumpMat.clone());
      bail.rotation.z = Math.PI / 2;
      bail.position.set(xOffset, 1.16, -8.8);
      scene.add(bail);
      bailsRef.current.push(bail);
    });

    // Bowling End Stumps (Z = +10.5)
    [-0.15, 0, 0.15].forEach(xOffset => {
      const stump = new THREE.Mesh(stumpGeo, stumpMat);
      stump.position.set(xOffset, 0.58, 10.5);
      scene.add(stump);
    });

    // Initialize 3D Entities
    batsmanRef.current = new BatsmanEntity(scene);
    bowlerRef.current = new BowlerEntity(scene);
    ballRef.current = new CricketBallEntity(scene);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Camera Shake decay
      if (cameraShakeRef.current > 0) {
        cameraShakeRef.current -= delta * 3.0;
        camera.position.x += (Math.random() - 0.5) * cameraShakeRef.current * 0.15;
        camera.position.y += (Math.random() - 0.5) * cameraShakeRef.current * 0.15;
      }

      if (batsmanRef.current) batsmanRef.current.update(delta);
      if (bowlerRef.current) bowlerRef.current.update(delta);

      if (ballRef.current) {
        ballRef.current.update(delta);

        // Track ball for timing zone
        const ballZ = ballRef.current.mesh.position.z;

        if (ballInFlightRef.current && !hasHitBallRef.current) {
          if (ballZ > -4.0) {
            setTimingIndicator({ text: 'BALL APPROACHING...', color: 'amber' });
          } else if (ballZ <= -4.0 && ballZ > -6.8) {
            setTimingIndicator({ text: 'GET READY ➔ POSITION HAND', color: 'cyan' });
          } else if (ballZ <= -6.8 && ballZ >= -9.0) {
            setTimingIndicator({ text: '⚡ SWING NOW! ⚡', color: 'lime' });

            // Detect Player Gesture Hit
            const currentGesture = lastGestureRef.current;
            if (currentGesture && currentGesture !== 'NEUTRAL') {
              executeShot(currentGesture, ballZ);
            }
          } else if (ballZ < -9.0) {
            // Passed crease without hit (Bowled or Missed)
            ballInFlightRef.current = false;
            executeMiss();
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Camera perspective switcher
  useEffect(() => {
    if (!cameraRef.current) return;
    if (cameraMode === 'BATTER') {
      cameraRef.current.position.set(0, 3.6, -13.5);
      cameraRef.current.lookAt(0, 1.8, 4);
    } else if (cameraMode === 'BROADCAST') {
      cameraRef.current.position.set(18, 14, 0);
      cameraRef.current.lookAt(0, 1.0, -3);
    } else if (cameraMode === 'BOWLER') {
      cameraRef.current.position.set(0, 3.2, 14.5);
      cameraRef.current.lookAt(0, 1.4, -8);
    }
  }, [cameraMode]);

  // Delivery Trigger
  const triggerDelivery = useCallback(() => {
    if (!isMatchActive || !bowlerRef.current || !ballRef.current) return;

    // Reset Zing LED bails & stumps
    bailsRef.current.forEach(bail => {
      bail.position.y = 1.16;
      bail.rotation.set(0, 0, Math.PI / 2);
      bail.material.emissive.setHex(0x000000);
      bail.material.emissiveIntensity = 0.0;
    });
    stumpsRef.current.forEach(stump => {
      stump.material.emissive.setHex(0x000000);
      stump.material.emissiveIntensity = 0.0;
    });

    batsmanRef.current.resetStance();
    hasHitBallRef.current = false;
    ballInFlightRef.current = false;
    setBowlerState('RUNUP');
    setLastShotFeedback(null);
    setTimingIndicator({ text: 'BOWLER RUN-UP...', color: 'slate' });

    bowlerRef.current.startDelivery(() => {
      setBowlerState('DELIVERED');
      ballInFlightRef.current = true;
      const bounceZ = 1.2 + Math.random() * 2.2;
      const targetX = (Math.random() - 0.5) * 0.45;
      ballRef.current.deliver(bounceZ, targetX);
    });
  }, [isMatchActive]);

  // Auto-bowl loop
  useEffect(() => {
    if (!isMatchActive) return;
    const timer = setInterval(() => {
      if (bowlerState === 'READY' || bowlerState === 'HIT') {
        triggerDelivery();
      }
    }, autoBowlInterval);

    return () => clearInterval(timer);
  }, [isMatchActive, bowlerState, autoBowlInterval, triggerDelivery]);

  // Flash Zing LED red lights when wickets fall
  const triggerZingLeds = () => {
    bailsRef.current.forEach(bail => {
      bail.material.emissive.setHex(0xff0033);
      bail.material.emissiveIntensity = 2.5;
    });
    stumpsRef.current.forEach(stump => {
      stump.material.emissive.setHex(0xff0033);
      stump.material.emissiveIntensity = 2.0;
    });
  };

  // Execute Shot Reaction
  const executeShot = (gesture, ballZ) => {
    hasHitBallRef.current = true;
    ballInFlightRef.current = false;
    setBowlerState('HIT');

    let shotTypeKey = 'DEFENSIVE_SHOT';
    let dirX = 0;

    if (gesture === 'OPEN_PALM') {
      shotTypeKey = 'DEFENSIVE_SHOT';
      dirX = 0;
    } else if (gesture === 'SWIPE_LEFT') {
      shotTypeKey = 'LEG_SIDE_SHOT';
      dirX = -1.2;
    } else if (gesture === 'SWIPE_RIGHT') {
      shotTypeKey = 'OFF_SIDE_SHOT';
      dirX = 1.2;
    } else if (gesture === 'RAISED_PALM') {
      shotTypeKey = 'LOFTED_SHOT';
      dirX = 0.35;
    } else if (gesture === 'CLOSED_FIST') {
      shotTypeKey = 'LEAVE_BALL';
      dirX = 0;
    }

    const deltaZ = Math.abs(ballZ - (-8.0));
    let timingKey = 'GOOD';
    if (deltaZ < 0.28) timingKey = 'PERFECT';
    else if (ballZ > -7.6) timingKey = 'EARLY';
    else if (ballZ < -8.4) timingKey = 'LATE';

    batsmanRef.current.playShot(shotTypeKey);
    const result = calculateBallResult(shotTypeKey, timingKey);

    if (result.isWicket) {
      sounds.playStumpClash();
      triggerZingLeds();
      cameraShakeRef.current = 0.6;
      bailsRef.current.forEach(bail => {
        bail.position.y += 0.9;
        bail.position.x += (Math.random() - 0.5) * 0.7;
        bail.rotation.x += Math.PI;
      });
      setTimingIndicator({ text: 'BOWLED! WICKET!', color: 'rose' });
    } else if (shotTypeKey !== 'LEAVE_BALL') {
      sounds.playBatCrack();
      if (result.runs >= 4) {
        sounds.playCrowdCheer();
        cameraShakeRef.current = result.runs === 6 ? 1.0 : 0.5;
      }
      ballRef.current.hitOutfield(result.runs, dirX);
      setTimingIndicator({
        text: `${result.runs} RUNS (${timingKey})`,
        color: result.runs >= 4 ? 'lime' : 'cyan'
      });
    } else {
      setTimingIndicator({ text: 'BALL LEFT SAFELY', color: 'slate' });
    }

    setLastShotFeedback({
      ...result,
      shotTypeKey,
      gesture
    });

    if (onBallComplete) {
      onBallComplete({
        ...result,
        shotTypeKey,
        gesture
      });
    }
  };

  // Played & Missed
  const executeMiss = () => {
    hasHitBallRef.current = true;
    setBowlerState('HIT');
    const result = calculateBallResult('DEFENSIVE_SHOT', 'MISSED');

    if (result.isWicket) {
      sounds.playStumpClash();
      triggerZingLeds();
      cameraShakeRef.current = 0.6;
      bailsRef.current.forEach(bail => {
        bail.position.y += 0.9;
        bail.rotation.x += Math.PI;
      });
      setTimingIndicator({ text: 'CLEAN BOWLED!', color: 'rose' });
    } else {
      setTimingIndicator({ text: 'BEATEN OUTSIDE OFF!', color: 'amber' });
    }

    setLastShotFeedback({
      ...result,
      shotTypeKey: 'DEFENSIVE_SHOT',
      gesture: 'MISSED'
    });

    if (onBallComplete) {
      onBallComplete({
        ...result,
        shotTypeKey: 'DEFENSIVE_SHOT',
        gesture: 'MISSED'
      });
    }
  };

  // Keyboard Shot Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const key = e.key.toUpperCase();

      if (key === 'A') executeShot('OPEN_PALM', -8.0);
      else if (e.key === 'ArrowLeft') executeShot('SWIPE_LEFT', -8.0);
      else if (e.key === 'ArrowRight') executeShot('SWIPE_RIGHT', -8.0);
      else if (e.key === 'ArrowUp' || e.code === 'Space') executeShot('RAISED_PALM', -8.0);
      else if (key === 'S') executeShot('CLOSED_FIST', -8.0);
      else if (key === 'B') triggerDelivery();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerDelivery]);

  const gestureCards = [
    { key: 'OPEN_PALM', label: 'Defend', icon: '✋', shot: 'Forward Block' },
    { key: 'SWIPE_LEFT', label: 'Flick', icon: '👈', shot: 'Leg Glance' },
    { key: 'SWIPE_RIGHT', label: 'Drive', icon: '👉', shot: 'Cover Drive' },
    { key: 'RAISED_PALM', label: 'Lofted', icon: '🙌', shot: 'Aerial Six' },
    { key: 'CLOSED_FIST', label: 'Leave', icon: '✊', shot: 'Shoulder Arms' }
  ];

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Top Left Controls */}
      <div className="absolute top-4 left-4 flex items-center gap-2.5 z-10">
        <button
          onClick={triggerDelivery}
          disabled={bowlerState === 'RUNUP' || bowlerState === 'DELIVERED'}
          className="px-4 py-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(163,230,53,0.35)] flex items-center gap-2 transition-all active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
          Bowl Delivery (B)
        </button>

        <div className="flex rounded-xl bg-slate-900/80 backdrop-blur border border-slate-800 p-1">
          {['BATTER', 'BROADCAST', 'BOWLER'].map(cam => (
            <button
              key={cam}
              onClick={() => setCameraMode(cam)}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                cameraMode === cam
                  ? 'bg-lime-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cam}
            </button>
          ))}
        </div>
      </div>

      {/* Top Center: Live Hit-Timing Dynamic Zone Guide */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className={`px-5 py-2 rounded-full border shadow-xl backdrop-blur-md flex items-center gap-2 transition-all ${
          timingIndicator.color === 'lime'
            ? 'bg-lime-950/90 border-lime-400 text-lime-300 animate-pulse scale-110 shadow-[0_0_24px_rgba(163,230,53,0.6)]'
            : timingIndicator.color === 'cyan'
            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
            : timingIndicator.color === 'amber'
            ? 'bg-amber-950/80 border-amber-400 text-amber-200'
            : timingIndicator.color === 'rose'
            ? 'bg-rose-950/80 border-rose-500 text-rose-200'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          <span className="font-display font-extrabold text-xs uppercase tracking-wider">
            {timingIndicator.text}
          </span>
        </div>
      </div>

      {/* Top Right: Active Hand Gesture Radar */}
      <div className="absolute top-4 right-4 z-10 bg-slate-950/85 backdrop-blur border border-slate-800 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3">
        <div className="flex flex-col text-right">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Webcam Gesture</span>
          <span className="text-sm font-extrabold text-lime-400 font-display">
            {activeGesture.replace('_', ' ')}
          </span>
        </div>
        <div className={`w-3.5 h-3.5 rounded-full ${
          activeGesture !== 'NEUTRAL'
            ? 'bg-lime-400 animate-ping shadow-[0_0_12px_#a3e635]'
            : 'bg-slate-700'
        }`} />
      </div>

      {/* Hit Feedback Floating Toast */}
      {lastShotFeedback && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-10">
          <div className={`px-6 py-2 rounded-full border shadow-2xl backdrop-blur-md flex items-center gap-3 ${
            lastShotFeedback.isWicket
              ? 'bg-rose-950/95 border-rose-500 text-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.5)]'
              : lastShotFeedback.runs >= 4
              ? 'bg-lime-950/95 border-lime-400 text-lime-200 shadow-[0_0_30px_rgba(163,230,53,0.5)]'
              : 'bg-slate-900/95 border-cyan-400 text-cyan-200'
          }`}>
            <span className="font-display font-black text-base tracking-wide uppercase">
              {lastShotFeedback.isWicket ? 'OUT - ' + lastShotFeedback.dismissalType : `${lastShotFeedback.runs} RUNS!`}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 font-bold uppercase tracking-wider">
              {lastShotFeedback.timing}
            </span>
          </div>
          <span className="text-[11px] text-slate-300 mt-1 font-medium bg-slate-950/80 px-3 py-0.5 rounded-full border border-slate-800">
            {lastShotFeedback.description}
          </span>
        </div>
      )}

      {/* Bottom Floating Interactive Gesture HUD Strip */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Keyboard shortcut pills */}
        <div className="text-[11px] text-slate-400 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 pointer-events-auto">
          <span className="text-slate-300 font-bold">Keys:</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded">A</kbd> Defend</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded">←</kbd> Leg</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded">→</kbd> Off</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded">↑/Space</kbd> Lofted</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded">S</kbd> Leave</span>
        </div>

        {/* 5 Live Gesture Status Badges */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {gestureCards.map(gc => {
            const isActive = activeGesture === gc.key;
            return (
              <div
                key={gc.key}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-lime-400 border-lime-300 text-slate-950 font-black shadow-[0_0_16px_rgba(163,230,53,0.7)] scale-105'
                    : 'bg-slate-900/80 border-slate-800/80 text-slate-400 font-semibold'
                }`}
              >
                <span>{gc.icon}</span>
                <span>{gc.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
