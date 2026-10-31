# 🏏 CRICKETVERSE AI

> **"Play with your hands. Analyse with AI. Improve your game."**

The Next-Generation AI-Powered Cricket Gaming Ecosystem combining real-time computer vision, browser-based 3D cricket simulation, and Google Gemma 4 edge intelligence.

---

## 🌟 Executive Summary

CRICKETVERSE AI transforms any standard laptop webcam into a cricket sensor and tactical batting analyst:
1. **Play with Your Hands**: MediaPipe Hand Landmarker tracks 21 3D hand landmarks in the browser at 30 FPS to execute defensive blocks, leg flicks, cover drives, lofted sixes, and leaves.
2. **Deterministic 3D Cricket Arena**: Lightweight Three.js procedural stadium with pitch physics, animated bowler run-up, batsman stroke animations, dislodging bails, and Web Audio API sound synthesis.
3. **AI Tactical Coach (Google Gemma 4)**: Evaluates real match statistics (strike rate, dot ball accumulation, boundary contribution) to deliver actionable weaknesses, corrections, and customized practice drills via local `gemma4:e2b` on Ollama.
4. **Live AI Broadcast Commentary**: Generates dynamic ball-by-ball commentary lines with broadcast personas and text-to-speech audio.
5. **Interactive Gesture Lab**: Calibrate resting wrist baseline, test kinematic swipe velocities, and inspect real-time skeleton visualizers.
6. **MCC Cricket Rules Assistant**: Grounded knowledge base for LBW, No-balls, Free hits, Powerplays, and Overs with citations.
7. **Zero-Cloud Privacy Guarantee**: Raw webcam frames **never** leave the browser; local inference via Ollama ensures complete data privacy.

---

## 🏗️ Project Architecture

```
cricketverse-ai/
│
├── client/                               # Frontend Web Application
│   ├── public/
│   │   └── models/                       # MediaPipe hand landmarker task model
│   ├── src/
│   │   ├── game/                         # 3D Three.js Cricket Arena & Game Engine
│   │   │   ├── CricketArena.jsx          # 3D Stadium, Bowler, Batsman, Stumps, Audio Synth
│   │   │   ├── Batsman.jsx               # 3D Batsman procedural model & stroke animations
│   │   │   ├── Bowler.jsx                # 3D Bowler procedural model & delivery stride
│   │   │   ├── Ball.jsx                  # 3D Ball trajectory, bounce & outfield physics
│   │   │   ├── scoring.js                # Deterministic scoring engine (0,1,2,4,6, wickets)
│   │   │   └── gameState.js              # Match state container & event tracker
│   │   ├── vision/                       # Computer Vision & MediaPipe Pipeline
│   │   │   ├── handLandmarker.js         # MediaPipe Tasks Vision wrapper & skeleton drawing
│   │   │   ├── gestureRecognition.js     # Cricket shot classifier (5 stroke mappings)
│   │   │   ├── calibration.js            # User hand size & resting baseline manager
│   │   │   └── smoothing.js              # Exponential moving average & voting debouncer
│   │   ├── components/
│   │   │   ├── views/                    # 7 Core Views
│   │   │   │   ├── HomeView.jsx          # Hero branding, how-it-works & architecture
│   │   │   │   ├── GameView.jsx          # Play Arena, 3D Canvas, Webcam HUD & Scoreboard
│   │   │   │   ├── GestureLabView.jsx    # 21-point skeleton visualizer, FPS & Calibration
│   │   │   │   ├── DashboardView.jsx     # Chart.js runs progression, wagon & shot charts
│   │   │   │   ├── AICoachView.jsx       # Gemma 4 Tactical Coach, Drills, Chat & Telemetry
│   │   │   │   ├── CommentaryView.jsx    # Live commentary feed, simulator & Speech TTS
│   │   │   │   └── RulesView.jsx         # Searchable MCC rules & Ask Gemma query tool
│   │   │   └── shared/
│   │   │       └── Navbar.jsx            # Persistent navigation with live AI status pill
│   │   ├── services/
│   │   │   ├── api.js                    # REST API client
│   │   │   └── socket.js                 # Socket.IO client
│   │   ├── styles/
│   │   │   └── index.css                 # Neo-brutalist / modern sports tech theme
│   │   ├── App.jsx                       # Root React router & central match state
│   │   └── main.jsx                      # Application entry point
│   ├── tests/
│   │   ├── scoring.test.js               # Scoring engine unit tests
│   │   └── gesture.test.js               # Gesture classification tests
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                               # Node.js Express & Socket.IO Server
│   ├── src/
│   │   ├── ai/
│   │   │   ├── OrchestratorAdapter.js    # Communicates with Python AI + Fallback engine
│   │   │   └── ProviderManager.js        # Tracks real latency, requests & health status
│   │   ├── rooms/
│   │   │   └── roomManager.js            # Match rooms & spectator broadcasting
│   │   ├── routes/
│   │   │   ├── health.js                 # /api/health and /api/ollama/status
│   │   │   ├── coach.js                  # /api/coach/analyze and /api/coach/chat
│   │   │   ├── commentary.js             # /api/commentary and history
│   │   │   └── rules.js                  # /api/rules/ask and all
│   │   └── index.js                      # Express app & Socket.IO server
│   ├── tests/
│   │   └── server.test.js                # Server integration tests
│   └── package.json
│
├── services/
│   └── ai-orchestrator/                  # Python AI Service
│       ├── app/
│       │   ├── models/
│       │   │   └── ollama_provider.py    # Ollama client with measured latency telemetry
│       │   ├── tools/
│       │   │   ├── analytics_tool.py     # Batting metrics, strike rate & weakness detection
│       │   │   ├── commentary_tool.py    # Broadcast commentary generation
│       │   │   └── rules_tool.py         # Curated rules question answering
│       │   ├── retrieval/
│       │   │   └── rules_retriever.py    # Token & keyword ranked rules search
│       │   ├── graph/
│       │   │   ├── state.py              # Pydantic & Dataclass workflow state
│       │   │   ├── nodes.py              # Validation, analytics, prompt & inference nodes
│       │   │   └── workflow.py           # Pipeline graph coordinator
│       │   └── main.py                   # Dual-engine server (FastAPI or builtin http)
│       ├── tests/
│       │   └── test_orchestrator.py      # AI service automated unit tests
│       └── requirements.txt
│
├── ml/                                   # Machine Learning Workspace
│   ├── src/
│   │   └── cricket_ml/
│   │       ├── preprocessing.py          # Landmark centering, normalization & EMA smoothing
│   │       ├── features.py               # Geometric finger extension & velocity extraction
│   │       └── inference.py              # Rule-based cricket stroke classifier
│   ├── configs/
│   │   └── gesture_config.json           # Movement thresholds & action mapping
│   └── tests/
│       └── test_cricket_ml.py            # ML pipeline unit tests
│
├── data/
│   └── rules/
│       └── processed/
│           └── cricket_rules.json        # Curated official MCC/ICC laws knowledge base
│
├── models/
│   ├── manifests/
│   │   └── gemma4_e2b.json               # Gemma 4 E2B model manifest
│   └── datasets/
│       └── evaluation_cases.json         # Realistic evaluation scenarios (High dot rate, etc.)
│
├── docs/                                 # Complete Engineering Documentation
│   ├── AI_ARCHITECTURE.md
│   ├── AI_ORCHESTRATION.md
│   ├── MODEL_LIFECYCLE.md
│   ├── EVALUATION_PROTOCOL.md
│   ├── AI_PRIVACY.md
│   ├── DECISIONS.md
│   ├── INITIAL_AUDIT.md
│   └── IMPLEMENTATION_PLAN.md
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## ✋ Cricket Hand Gesture Mapping

| Hand Gesture | Cricket Stroke | Physical Action | Scoring Potential |
|---|---|---|---|
| **✋ Open Palm** | **Defensive Block** | Flat open palm held steady in front | 0-1 Runs (Low Risk) |
| **👈 Swipe Left** | **Leg-Side Flick** | Fast horizontal leftward wrist sweep | 1-4 Runs (Pad Glance) |
| **👉 Swipe Right** | **Off-Side Cover Drive** | Fast horizontal rightward wrist sweep | 1-4 Runs (Through Point) |
| **🙌 High Palm** | **Lofted Maximum Drive** | Open palm raised above shoulder height | 4-6 Runs (Aerial Risk) |
| **✊ Closed Fist** | **Leave Ball** | Clenched fist; shoulders arms | 0 Runs (Safe Outside Off) |

*Note: Keyboard fallback keys are also active at all times (`A` = Defend, `←` = Leg flick, `→` = Off drive, `↑`/`Space` = Lofted 6, `S` = Leave ball, `B` = Bowl next delivery).*

---

## 🚀 Quickstart Guide (Windows 11)

### 1. Prerequisites
- **Node.js** (v18+ or v20+, Node v24 supported)
- **Python** (3.9+)
- *(Optional)* **Ollama** with `gemma4:e2b` model

---

### 2. Ollama & Gemma 4 Setup (Optional, Fallback Active If Offline)

1. Download Ollama from [https://ollama.ai](https://ollama.ai).
2. Pull the compact Google Gemma 4 edge model:
   ```bash
   ollama pull gemma4:e2b
   ```
3. Verify Ollama is running:
   ```bash
   curl http://127.0.0.1:11434/api/tags
   ```

> *If Ollama is not installed or unreachable, the application automatically runs in **Offline Fallback Mode** with 100% functionality and clearly labeled telemetry.*

---

### 3. MediaPipe Model Setup

The client is pre-configured to load MediaPipe Hand Landmarker directly from Google's official CDN with zero manual configuration. 

*(Optional local setup)*: Download `hand_landmarker.task` into `client/public/models/`:
```powershell
Invoke-WebRequest -Uri "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task" -OutFile "client\public\models\hand_landmarker.task"
```

---

### 4. Running the Complete System

Open 3 terminal windows to launch each microservice:

#### Terminal 1: Python AI Orchestrator
```bash
cd services/ai-orchestrator
python app/main.py
```
*Orchestrator starts at: `http://127.0.0.1:8000` (FastAPI or Builtin HTTP)*

#### Terminal 2: Node.js & Socket.IO Match Server
```bash
cd server
npm install
npm start
```
*Server starts at: `http://127.0.0.1:5000`*

#### Terminal 3: React Frontend Client
```bash
cd client
npm install
npm run dev
```
*Vite web application opens at: `http://localhost:5173`*

---

## 🧪 Automated Testing Suite

Run all verified test suites across all 4 system tiers:

```bash
# 1. Run Machine Learning Tests (Centering, Kinematics, Feature Extraction)
python ml/tests/test_cricket_ml.py

# 2. Run AI Orchestrator Tests (Analytics, Retrieval, Commentary, Workflow)
python services/ai-orchestrator/tests/test_orchestrator.py

# 3. Run Node.js Server Tests (Rooms, Telemetry, Fallback Adapter)
node server/tests/server.test.js

# 4. Run Client Tests (Scoring Engine & Gesture Recognizer)
node client/tests/scoring.test.js
node client/tests/gesture.test.js
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | System uptime and service health check |
| `/api/ollama/status` | GET | Connection status to Gemma 4, model verification & real telemetry |
| `/api/coach/analyze` | POST | Full postmortem match analysis & drill prescription |
| `/api/coach/chat` | POST | Interactive conversation with Gemma AI Coach |
| `/api/commentary` | POST | Contextual commentary generation for live match events |
| `/api/commentary/history` | GET | Recent commentary broadcast log |
| `/api/rules/ask` | POST | MCC rules consultation with cited law conditions |
| `/api/rules/all` | GET | Complete curated cricket laws database |

---

## 🎬 3-Minute Hackathon Demonstration Script

1. **Introduction (30s)**:
   - Open `http://localhost:5173`.
   - Point out the persistent status pill: shows Gemma 4 online or fallback telemetry.
   - Highlight the neo-brutalist sports tech theme and the tagline: *"Play with your hands. Analyse with AI. Improve your game."*

2. **Gesture Lab Showcase (45s)**:
   - Navigate to **GESTURE LAB**.
   - Click **Start Camera Feed**.
   - Wave your hand: demonstrate 21 real-time landmark coordinates and skeleton rendering at 30 FPS.
   - Show: Open Palm (Defensive), Swipe Left (Leg-side), Swipe Right (Off-side), High Palm (Lofted 6), Closed Fist (Leave).
   - Click **Calibrate Stance** to show baseline wrist and palm threshold tuning.

3. **3D Play Arena (45s)**:
   - Navigate to **PLAY ARENA**.
   - Click **Start Cam** to display the webcam HUD alongside the 3D pitch.
   - Click **Bowl Next Ball (B)**: watch the bowler run up and deliver with pitch bounce.
   - Swing your hand in real-time or press `A`, `←`, `→`, `↑`, `S`.
   - Hear the procedural Web Audio bat crack and crowd roar!
   - Watch the live ball commentary banner update and bails fly off if bowled!

4. **Analytics & Gemma 4 Tactical Coach (60s)**:
   - Navigate to **DASHBOARD**: showcase Chart.js cumulative score progression, runs per over, and shot wagon wheel.
   - Navigate to **AI TACTICAL COACH**:
     - Review the 4 structured sections: Match Intelligence, Evidence Observations, Tactical Corrections, and Recommended Drills.
     - Inspect **Model Telemetry**: point out real measured request latency (ms), success count, and fallback count.
     - Type in the Gemma Chat: *"How can I improve my strike rate?"* or click any preset prompt to receive instant tactical feedback.
   - Switch to **CRICKET RULES**: ask *"Explain the LBW law"* to demonstrate curated knowledge retrieval.

---

## 🔒 Privacy & Compliance

- **No Video Streaming**: Raw video is never recorded, saved, or uploaded to any server.
- **Client-Side Edge Vision**: MediaPipe processes frames strictly inside client WebAssembly.
- **Local Inference**: Google Gemma 4 operates on `127.0.0.1:11434` with zero cloud API keys or telemetry leaks.
- **Graphify Compliance**: No Graphify files or dependencies exist in this project.

---

*Built with passion for the Next Generation of Cricket Gaming & AI Engineering.*
