# AI ARCHITECTURE SPECIFICATION

## CRICKETVERSE AI: System Design & Edge Intelligence

### 1. Architectural Vision
CRICKETVERSE AI is an AI-powered cricket gaming ecosystem combining:
1. Browser-based 3D cricket simulation (Three.js + HTML5 Canvas).
2. Real-time webcam hand gesture recognition (MediaPipe Tasks Vision).
3. AI-generated cricket commentary.
4. AI Tactical Coach powered by Google Gemma 4 (`gemma4:e2b`).
5. Real-time cricket match analytics (Chart.js).
6. Interactive Gesture Lab & calibration tools.
7. Official MCC Cricket Rules Assistant.
8. Live telemetry monitoring.

---

### 2. Boundary of Responsibilities: Deterministic vs. AI

A critical tenet of the system design is maintaining an absolute boundary between deterministic physics/scoring and generative AI reasoning:

| Layer | Responsibility | Technology | AI Involvement? |
|---|---|---|---|
| **Physics & Ball Trajectory** | 3D ball motion, bounce, seam rotation, impact | Three.js & JavaScript Math | **NO (Deterministic)** |
| **Contact Detection** | Early, Perfect, Late, Missed timing windows | Timing Zone Engine | **NO (Deterministic)** |
| **Match Scoring Rules** | 0, 1, 2, 3, 4, 6 runs, Bowled, Caught, Over counts | `scoring.js` (Deterministic rules) | **NO (Deterministic)** |
| **Hand Tracking** | 21 hand landmarks & skeleton joints | MediaPipe Hand Landmarker | Machine Learning (Edge Vision) |
| **Shot Inference** | Open Palm, Swipe Left/Right, High Palm, Fist | `gestureRecognition.js` & `cricket_ml` | Kinematic Pattern Classification |
| **Broadcast Commentary** | Dynamic ball-by-ball commentary lines | Google Gemma 4 (`gemma4:e2b`) | **YES (Generative)** |
| **Tactical Coaching** | Match postmortems, weakness diagnosis, drills | Google Gemma 4 (`gemma4:e2b`) | **YES (Generative)** |
| **Rules Explanation** | Curated MCC rule explanations and citations | Google Gemma 4 (`gemma4:e2b`) | **YES (RAG / Knowledge Grounding)** |

> **Important**: Gemma 4 is never asked to calculate live ball physics, runs, or wickets. The deterministic engine calculates match statistics first and passes structured numerical payloads to the AI.

---

### 3. High-Level Component Topology

```
+-----------------------------------------------------------------------------------+
|                                  BROWSER CLIENT                                   |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | WebCam Video Feed  |-->| MediaPipe Hand Vision |-->| Gesture Recognizer     |  |
|  | (Local in memory)  |   | (21 3D Landmarks)     |   | (Cricket Shot Mapping) |  |
|  +--------------------+   +-----------------------+   +-----------+------------+  |
|                                                                   |               |
|                                                                   v               |
|  +----------------------------------------------------------------+------------+  |
|  |                        3D THREE.JS CRICKET ARENA                            |  |
|  |  * Stadium & Pitch           * Bowler Run-Up Delivery                       |  |
|  |  * Batsman Shot Animation    * Ball Trajectory & Physics                    |  |
|  |  * Web Audio Synthesizer     * Deterministic Scoring & Over Tracker         |  |
|  +----------------------------------------+------------------------------------+  |
|                                           |                                       |
|                                           | Match Events & Telemetry              |
|                                           v                                       |
|  +-----------------------------------------------------------------------------+  |
|  |                        REACT DASHBOARD & VIEWS                              |  |
|  |  * Play Arena      * Gesture Lab     * Analytics (Chart.js)                 |  |
|  |  * Gemma 4 Coach   * Commentary Feed * MCC Rules Assistant                  |  |
|  +----------------------------------------+------------------------------------+  |
+-------------------------------------------|---------------------------------------+
                                            |
                                            | REST / WebSockets (Port 5000)
                                            v
+-----------------------------------------------------------------------------------+
|                        MAIN NODE.JS & SOCKET.IO SERVER                            |
|                                                                                   |
|  * Express REST API Routing (/api/coach, /api/commentary, /api/rules, /api/health)|
|  * ProviderManager (Telemetry Tracking, Pings, Success/Failure counters)          |
|  * OrchestratorAdapter (Proxy + Built-in Node Fallback Engine)                     |
|  * RoomManager (Match State Broadcasting & Spectator Lobbies)                     |
+-------------------------------------------+---------------------------------------+
                                            |
                                            | Internal HTTP (Port 8000)
                                            v
+-----------------------------------------------------------------------------------+
|                   PYTHON AI ORCHESTRATOR (FastAPI / HTTP Server)                  |
|                                                                                   |
|  * AnalyticsTool (Metrics, Strike Rate Velocity, Dot Ball Pressure Index)         |
|  * RulesRetriever & RulesTool (Curated MCC Law JSON Matching)                     |
|  * CommentaryTool (Contextual Prompt Construction)                                |
|  * CoachWorkflow Pipeline (Validation -> Feature Stats -> Gemma -> Response)      |
+-------------------------------------------+---------------------------------------+
                                            |
                                            | HTTP (Port 11434)
                                            v
+-----------------------------------------------------------------------------------+
|                        LOCAL OLLAMA INFERENCE RUNTIME                             |
|                                                                                   |
|  * Model: gemma4:e2b (Google Gemma 4 Edge Instruction Model)                      |
|  * Zero Cloud Dependencies, 100% On-Device, Privacy Guaranteed                    |
+-----------------------------------------------------------------------------------+
```

---

### 4. Telemetry and Fault-Tolerance Policy

When Ollama is offline or uninstalled:
1. The system detects the condition via non-blocking health checks (`timeout: 1.5s`).
2. The UI clearly displays an **`Ollama: Offline (Fallback Mode)`** badge.
3. Telemetry counters accurately record:
   - Total requests
   - Successful requests (0 if offline)
   - Failed requests
   - Fallback count
   - Real measured latency in milliseconds
4. The system seamlessly routes calls to the calibrated deterministic engine, returning comprehensive technical breakdowns without fabricating benchmark numbers or claiming Gemma generated them.
