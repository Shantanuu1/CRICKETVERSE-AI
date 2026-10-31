"""
CricketVerse AI - Python AI Orchestrator Service.
Coordinates Google Gemma 4 (gemma4:e2b) local inference via Ollama,
match analytics processing, live commentary generation, and rules retrieval.
Supports FastAPI when installed, with native http.server fallback.
"""

import os
import sys
import json
import time
from typing import Dict, Any, Optional, List

if __package__ is None or __package__ == "":
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from app.models.ollama_provider import OllamaProvider
    from app.tools.analytics_tool import AnalyticsTool
    from app.tools.commentary_tool import CommentaryTool
    from app.tools.rules_tool import RulesTool
    from app.retrieval.rules_retriever import RulesRetriever
    from app.graph.workflow import CricketCoachWorkflow
else:
    from .models.ollama_provider import OllamaProvider
    from .tools.analytics_tool import AnalyticsTool
    from .tools.commentary_tool import CommentaryTool
    from .tools.rules_tool import RulesTool
    from .retrieval.rules_retriever import RulesRetriever
    from .graph.workflow import CricketCoachWorkflow

# Initialize singletons
ollama_provider = OllamaProvider()
rules_retriever = RulesRetriever()
commentary_tool = CommentaryTool(ollama_provider)
rules_tool = RulesTool(ollama_provider, rules_retriever)
coach_workflow = CricketCoachWorkflow(ollama_provider)


def handle_health() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "CricketVerse AI Orchestrator",
        "version": "1.0.0",
        "timestamp": time.time(),
    }


def handle_ollama_status() -> Dict[str, Any]:
    health_info = ollama_provider.check_health()
    telemetry = ollama_provider.get_telemetry()
    return {**health_info, "telemetry": telemetry}


def handle_coach_analyze(match_data: Dict[str, Any], user_query: Optional[str] = None) -> Dict[str, Any]:
    workflow_state = coach_workflow.execute(match_data, user_query)
    if not workflow_state.validated:
        return {"success": False, "error": workflow_state.validation_error}

    return {
        "success": True,
        "report": workflow_state.coach_report,
        "is_fallback": workflow_state.is_fallback,
        "provider": workflow_state.provider,
        "latency_ms": workflow_state.latency_ms,
        "telemetry": ollama_provider.get_telemetry(),
    }


def handle_coach_chat(message: str, match_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    start_time = time.perf_counter()
    context_str = ""
    if match_data:
        m = match_data
        context_str = (
            f"Active Match Context:\n"
            f"- Runs: {m.get('runs', 0)} ({m.get('balls', 0)} balls)\n"
            f"- Wickets: {m.get('wickets', 0)}\n"
            f"- Boundaries: {m.get('fours', 0)} fours, {m.get('sixes', 0)} sixes\n"
            f"- Dot Balls: {m.get('dot_balls', 0)}\n"
        )

    system_prompt = (
        "You are 'Gemma Coach', an elite, encouraging, high-performance cricket batting coach. "
        "Answer the user's questions about batting technique, tactical match play, mental focus, "
        "and shot selection concisely and constructively. If match data is provided, reference their actual numbers."
    )

    prompt = f"{context_str}\nPlayer: {message}\nCoach Gemma:"

    ai_resp = ollama_provider.generate(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.4,
    )

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    if not ai_resp["is_fallback"] and ai_resp["text"]:
        return {
            "reply": ai_resp["text"],
            "is_fallback": False,
            "provider": "gemma4:e2b",
            "latency_ms": ai_resp["latency_ms"],
            "telemetry": ollama_provider.get_telemetry(),
        }

    # Deterministic fallback chat responses
    msg_lower = message.lower()
    if "strike rate" in msg_lower:
        fallback_reply = "To raise your strike rate without excessive risk, focus on finding gaps in the inner circle during the first 10 balls. Nudging singles keeps the scoreboard ticking and shifts fielding pressure back onto the bowler."
    elif "weakness" in msg_lower or "lose" in msg_lower:
        fallback_reply = "A major vulnerability observed in match sessions is consecutive dot ball accumulation. When under pressure, players often force aggressive lofted shots too early. Build your innings with low-risk placements first."
    elif "practice" in msg_lower or "drill" in msg_lower:
        fallback_reply = "I recommend our 'Strike Rotation Grid' drill: face 18 deliveries using only soft hands to push balls into mid-wicket and backward point. This ingrains quick single awareness."
    elif "strategy" in msg_lower or "next match" in msg_lower:
        fallback_reply = "Next match plan: Target 10-12 runs per over during the powerplay using off-side drives, then settle into calculated risk-taking. Never pre-meditate your shot before the ball pitches."
    else:
        fallback_reply = "Cricket is a game of rhythm and balance. Focus on watching the ball right out of the bowler's release point, maintaining head stability over the ball, and executing your chosen stroke with full commitment."

    return {
        "reply": fallback_reply,
        "is_fallback": True,
        "provider": "deterministic-cricket-tactical-engine",
        "latency_ms": round(elapsed_ms, 2),
        "telemetry": ollama_provider.get_telemetry(),
    }


def handle_commentary(event_type: str, runs: int = 0, shot_type: str = "SHOT", context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    result = commentary_tool.generate_commentary(
        event_type=event_type,
        runs=runs,
        shot_type=shot_type,
        context=context,
    )
    return {
        "success": True,
        **result,
        "telemetry": ollama_provider.get_telemetry(),
    }


def handle_rules(question: str) -> Dict[str, Any]:
    result = rules_tool.answer_question(question)
    return {
        "success": True,
        **result,
        "telemetry": ollama_provider.get_telemetry(),
    }


# Dual Server Engine: FastAPI or Standard Library HTTPServer
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field

    app = FastAPI(
        title="CricketVerse AI - Orchestrator",
        version="1.0.0",
        description="Next-Gen AI Tactical Coach & Match Intelligence Service powered by Google Gemma 4",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class MatchAnalysisRequest(BaseModel):
        match_data: Dict[str, Any]
        user_query: Optional[str] = None

    class CoachChatRequest(BaseModel):
        message: str
        match_data: Optional[Dict[str, Any]] = None

    class CommentaryRequest(BaseModel):
        event_type: str = Field(..., description="DOT, SINGLE, DOUBLE, FOUR, SIX, WICKET")
        runs: int = 0
        shot_type: str = "SHOT"
        context: Optional[Dict[str, Any]] = None

    class RulesRequest(BaseModel):
        question: str

    @app.get("/health")
    def api_health():
        return handle_health()

    @app.get("/ollama/status")
    def api_ollama_status():
        return handle_ollama_status()

    @app.post("/coach/analyze")
    def api_coach_analyze(req: MatchAnalysisRequest):
        res = handle_coach_analyze(req.match_data, req.user_query)
        if not res.get("success", False):
            raise HTTPException(status_code=400, detail=res.get("error"))
        return res

    @app.post("/coach/chat")
    def api_coach_chat(req: CoachChatRequest):
        return handle_coach_chat(req.message, req.match_data)

    @app.post("/commentary")
    def api_commentary(req: CommentaryRequest):
        return handle_commentary(req.event_type, req.runs, req.shot_type, req.context)

    @app.post("/rules/ask")
    def api_rules(req: RulesRequest):
        return handle_rules(req.question)

    HAS_FASTAPI = True

except ImportError:
    HAS_FASTAPI = False
    app = None


def run_builtin_server(port: int = 8000):
    """Runs zero-dependency HTTP server when FastAPI is not installed."""
    from http.server import HTTPServer, BaseHTTPRequestHandler
    from urllib.parse import urlparse

    class CricketVerseRequestHandler(BaseHTTPRequestHandler):
        def _set_cors(self, status=200):
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.end_headers()

        def do_OPTIONS(self):
            self._set_cors(200)

        def do_GET(self):
            parsed = urlparse(self.path)
            if parsed.path == "/health":
                self._set_cors(200)
                self.wfile.write(json.dumps(handle_health()).encode("utf-8"))
            elif parsed.path == "/ollama/status":
                self._set_cors(200)
                self.wfile.write(json.dumps(handle_ollama_status()).encode("utf-8"))
            else:
                self._set_cors(404)
                self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))

        def do_POST(self):
            parsed = urlparse(self.path)
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
            try:
                data = json.loads(body)
            except Exception:
                data = {}

            if parsed.path == "/coach/analyze":
                res = handle_coach_analyze(data.get("match_data", {}), data.get("user_query"))
                self._set_cors(200 if res.get("success") else 400)
                self.wfile.write(json.dumps(res).encode("utf-8"))
            elif parsed.path == "/coach/chat":
                res = handle_coach_chat(data.get("message", ""), data.get("match_data"))
                self._set_cors(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))
            elif parsed.path == "/commentary":
                res = handle_commentary(
                    data.get("event_type", "DOT"),
                    data.get("runs", 0),
                    data.get("shot_type", "SHOT"),
                    data.get("context"),
                )
                self._set_cors(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))
            elif parsed.path == "/rules/ask":
                res = handle_rules(data.get("question", ""))
                self._set_cors(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))
            else:
                self._set_cors(404)
                self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))

        def log_message(self, format, *args):
            # Suppress noisy logs
            return

    server = HTTPServer(("0.0.0.0", port), CricketVerseRequestHandler)
    print(f"[CricketVerse AI Orchestrator] Running on http://127.0.0.1:{port} (Builtin HTTP Engine)")
    server.serve_forever()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    if HAS_FASTAPI:
        import uvicorn
        print(f"[CricketVerse AI Orchestrator] Running on http://127.0.0.1:{port} (FastAPI/Uvicorn)")
        uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
    else:
        run_builtin_server(port)
