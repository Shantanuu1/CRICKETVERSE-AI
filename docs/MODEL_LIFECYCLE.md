# MODEL LIFECYCLE: GOOGLE GEMMA 4 (gemma4:e2b)

## 1. Model Overview
- **Identifier**: `gemma4:e2b`
- **Family**: Google Gemma (High-efficiency edge instruction model)
- **Runtime Environment**: Local Ollama Daemon (`http://127.0.0.1:11434`)
- **Quantization**: 4-bit / 8-bit edge quantized for standard laptop CPU / GPU execution
- **Context Length**: 4,096 tokens
- **Temperature Setting**: 0.2 to 0.4 (Optimized for technical precision and deterministic sports commentary)

---

## 2. Intended Operational Tasks
1. **Cricket Match Postmortem Analysis**: Synthesize tactical reviews from structured match payloads.
2. **Batting Vulnerability Diagnosis**: Detect over-reliance on single shot corridors (e.g. leg-side bias) or excessive dot balls.
3. **Personalized Drill Formulation**: Prescribe customized technical drills tailored to user weaknesses.
4. **Live Ball Commentary Generation**: Produce dynamic, broadcast-grade reactions to real-time gameplay events.
5. **MCC Cricket Rules Explanations**: Provide cited, accessible explanations of official cricket laws.

---

## 3. Explicit Model Limitations
- **No Direct Physics Simulation**: The model is NOT permitted to calculate ball collision, spin drift, or boundary trajectories.
- **No Deterministic Scoring**: All score increments (0, 1, 2, 4, 6) and wicket state changes are strictly calculated in JavaScript.
- **No Raw Video Input**: The model receives structured JSON statistics and detected gesture labels, NEVER raw webcam images or video buffers.

---

## 4. Setup and Verification Workflow

### Step 1: Install Ollama
Download and install Ollama from [https://ollama.ai](https://ollama.ai).

### Step 2: Pull the Model
```bash
ollama pull gemma4:e2b
```

### Step 3: Verify Model Availability
```bash
curl http://127.0.0.1:11434/api/tags
```
Verify that `gemma4:e2b` appears in the returned models array.

---

## 5. Fallback & Telemetry Policy
If Ollama is not running:
- Health check marks `online: false`.
- UI displays `Ollama: Offline (Fallback Mode)`.
- Fallback requests are tallied in real telemetry.
- Fallback responses are clearly labeled `is_fallback: true` and attributed to `deterministic-cricket-tactical-engine`.
