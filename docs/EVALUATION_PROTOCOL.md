# EVALUATION PROTOCOL: CRICKETVERSE AI

## 1. Purpose
This protocol defines testing standards for verifying the accuracy, latency, and fault tolerance of the CRICKETVERSE AI ecosystem.

---

## 2. Evaluation Criteria

### A. Computer Vision Gesture Precision
- **Hand Detection Confidence**: Must exceed 0.50 for active frame processing.
- **Gesture Classification Confidence**: Must score >= 0.70 before triggering shot stroke.
- **Latency**: End-to-end frame processing (detection + classification + smoothing) must operate <= 35ms to sustain 25-30 FPS in standard browser environments.
- **Cooldown**: Minimum 400ms cooldown window to prevent duplicate triggers from a single batting stroke.

### B. Scoring Determinism
- Wickets must decrement available batters accurately.
- Over transitions must trigger strictly every 6 valid deliveries.
- Strike rates must match the standard equation: `(Runs / Balls) * 100` rounded to 2 decimals.
- Boundaries must contribute exactly 4 or 6 runs without discrepancy.

### C. AI Tactical Coach Quality
- **Grounding**: 100% of insights must cite numbers from the submitted match payload.
- **Structure**: Output must present:
  1. Match Performance Summary
  2. Batting Strengths
  3. Weaknesses & Vulnerabilities
  4. Technical Corrections
  5. Recommended Drills
  6. Next-Match Blueprint
- **Fallback Integrity**: If Ollama is unavailable, the fallback engine must produce complete structured advice within 20ms without hanging the client.

---

## 3. Evaluation Test Cases (`models/datasets/evaluation_cases.json`)

### Scenario 1: High Dot Ball Pressure (TC-001)
- Input: 32 runs, 24 balls, 12 dots, 3 wickets.
- Expected Finding: Identifies 50% dot ball pressure as the primary root cause of rushed shots.

### Scenario 2: Aggressive Finisher (TC-002)
- Input: 58 runs, 20 balls, 6 sixes, 4 fours, 0 wickets.
- Expected Finding: Commends elite strike rate (>250), recommends pacing against yorkers.

### Scenario 3: Heavy Leg-Side Bias (TC-003)
- Input: 14 out of 18 shots targeted to the leg side.
- Expected Finding: Flags predictable shot corridor, prescribes off-side cover drive drills.

---

## 4. Benchmark Authenticity Policy
In accordance with engineering guidelines:
- Evaluation results tables remain empty until actual evaluations are recorded against a running model instance.
- No synthetic or fabricated benchmark scores are published.
