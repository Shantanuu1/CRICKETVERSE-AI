# IMPLEMENTATION PLAN & WORKFLOW PHASES

## CRICKETVERSE AI — Development Roadmap

### Phase 1: Core Foundation & Rules Knowledge
- Structure verified MCC cricket laws into `data/rules/processed/cricket_rules.json`.
- Define Gemma 4 model manifest (`models/manifests/gemma4_e2b.json`).
- Establish realistic evaluation scenarios (`models/datasets/evaluation_cases.json`).

### Phase 2: Computer Vision & ML Workspace
- Implement `ml/src/cricket_ml` for landmark preprocessing, feature extraction, and inference.
- Verify landmark centering, scaling, and swipe detection with unit tests.
- Integrate `@mediapipe/tasks-vision` in browser client with canvas skeleton rendering.
- Implement `calibration.js` and `smoothing.js` with exponential moving averages and voting debouncers.

### Phase 3: 3D Cricket Arena & Deterministic Engine
- Construct Three.js procedural cricket stadium with mowed pitch, creases, and lighting.
- Build animated 3D Bowler (run-up & delivery windmill) and Batsman (stance & 5 stroke animations).
- Develop red cricket ball physics with seam rotation, pitch bounce, and outfield hits.
- Synthesize realistic bat cracks, crowd roars, and stump clashes via Web Audio API.
- Implement strict deterministic scoring rules: 6 balls/over, 0, 1, 2, 4, 6 runs, bowled, caught, and strike rates.

### Phase 4: Python AI Orchestrator & Local Gemma 4
- Build `OllamaProvider` with real latency tracking and graceful offline detection.
- Develop `AnalyticsTool` for batting tempo and vulnerability identification.
- Develop `CommentaryTool` with broadcast personas and instant fallback commentary.
- Develop `RulesTool` and `RulesRetriever` for cited MCC rules query.
- Create dual-engine FastAPI / builtin HTTP server for zero-dependency execution.

### Phase 5: Main Node.js Server & Real-Time Sync
- Implement Express REST APIs forwarding to Python Orchestrator.
- Integrate Socket.IO for real-time match state, ball broadcast, and player gesture streams.
- Provide Node-level deterministic fallback engine if Python service is stopped.

### Phase 6: Frontend Views & Neo-Brutalist Sports UI
- Build persistent navigation bar with live AI status pill.
- Create HomeView with product cards, how-it-works roadmap, and tech stack.
- Create GameView with 3D arena, live webcam gesture HUD, and scoreboard.
- Create GestureLabView with skeleton visualizer, FPS counter, and calibration controls.
- Create DashboardView with Chart.js multi-chart analytics and summary metrics.
- Create AICoachView with Match Intelligence, Observations, Corrections, Drills, Gemma Chat, and Telemetry.
- Create CommentaryView with live ball simulator and text-to-speech audio toggle.
- Create RulesView with searchable laws directory and Ask AI query bar.

### Phase 7: Verification & Package Archive
- Execute all unit tests across ML, Python Orchestrator, Node Server, and Client.
- Package the entire project into a standalone, downloadable ZIP archive.
