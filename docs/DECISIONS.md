# ARCHITECTURAL DECISION RECORDS (ADR)

## ADR-001: MediaPipe Tasks Vision for Browser-Based Hand Tracking
- **Status**: Accepted
- **Context**: Real-time hand tracking is required for gesture-driven batting control without specialized gaming hardware.
- **Decision**: Adopt Google's official `@mediapipe/tasks-vision` HandLandmarker running locally in WebAssembly and WebGL.
- **Consequences**:
  - Delivers 25-30 FPS on standard consumer laptop webcams.
  - Zero server GPU costs for computer vision inference.
  - Eliminates privacy risks since raw frames never leave the client.

---

## ADR-002: Procedural 3D Cricket Arena using Three.js
- **Status**: Accepted
- **Context**: 3D cricket visuals are required without bloated multi-gigabyte 3D asset downloads.
- **Decision**: Implement procedural 3D geometries (cylinder stands, oval turf, 22-yard pitch, box bats, and sphere seam balls) in Three.js with realistic lighting, shadows, and Web Audio API synthesized bat cracks and crowd roars.
- **Consequences**:
  - Instant page load (< 2 seconds).
  - 60 FPS smooth rendering on laptop GPUs.
  - No external 3D GLTF asset loading errors during live hackathon demos.

---

## ADR-003: Deterministic Game Scoring vs. Generative AI
- **Status**: Accepted
- **Context**: Cricket scoring rules (runs, wickets, overs, strike rate) must be 100% predictable and reproducible.
- **Decision**: Keep game scoring strictly in client JavaScript (`scoring.js`). Do not allow LLMs to calculate runs or ball outcomes.
- **Consequences**:
  - Absolute determinism.
  - Zero scoring hallucinations.
  - Instant game responsiveness without waiting for LLM completion tokens.

---

## ADR-004: Local Google Gemma 4 via Ollama with Dual-Engine Fallback
- **Status**: Accepted
- **Context**: Hackathon evaluation environments may not have a running Ollama daemon or powerful GPU.
- **Decision**: Connect to local `gemma4:e2b` via Ollama (`http://127.0.0.1:11434`), paired with an automatic, non-blocking fallback engine.
- **Consequences**:
  - If Ollama is active, evaluates using Gemma 4.
  - If Ollama is offline, the app continues to function seamlessly with clearly marked fallback reports.
  - Telemetry monitors real latency, successes, and fallbacks without fabrication.

---

## ADR-005: Dual Python Server Engine (FastAPI + Builtin HTTP)
- **Status**: Accepted
- **Context**: Virtual environments across judge laptops may have differing installed packages.
- **Decision**: Build the Python AI Orchestrator to use FastAPI/Uvicorn if installed, with automatic fallback to standard library `http.server.HTTPServer`.
- **Consequences**:
  - Python service runs out of the box with zero external pip dependencies.
