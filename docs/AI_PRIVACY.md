# AI PRIVACY & DATA GOVERNANCE POLICY

## CRICKETVERSE AI: Privacy-First Architecture

### 1. Zero Webcam Image Transmissions
**The Golden Privacy Rule of CRICKETVERSE AI:**
> **No raw camera feed, video frame, photo, or facial image ever leaves the user's browser.**

- The webcam stream is captured locally in client memory using the HTML5 `navigator.mediaDevices.getUserMedia` API.
- The MediaPipe Tasks Vision WebAssembly/WebGL landmarker extracts 21 mathematical 3D coordinate pairs strictly on the client device.
- All raw image buffers are immediately discarded from memory after landmark extraction.

---

### 2. Payload Sanitization: What Is Sent to the AI Service
Only high-level, sanitized mathematical representations are transmitted to backend services:
- Structured match statistics (e.g. `{"runs": 24, "balls": 12, "wickets": 1}`).
- Symbolic gesture labels (e.g. `"SWIPE_LEFT"`, `"RAISED_PALM"`).
- Plaintext user coaching chat questions (e.g. `"How can I improve my strike rate?"`).

---

### 3. Local Model Inference (Google Gemma 4)
- Google Gemma 4 runs on the player's local machine via Ollama on `127.0.0.1:11434`.
- No user chat, performance statistics, or gaming data is transmitted to third-party commercial cloud APIs.
- The system functions with zero internet connection once dependencies and models are downloaded locally.

---

### 4. Zero PII Storage
- No personal names, email addresses, cookies, or tracking identifiers are collected or stored in persistent databases.
- Match rooms and socket IDs are stored in volatile memory and cleared when the session terminates.
