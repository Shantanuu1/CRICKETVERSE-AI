"""
Pipeline Nodes for CricketVerse AI Coaching Workflow.
Implements modular stages:
1. ValidateInputNode
2. ProcessAnalyticsNode
3. ConstructPromptNode
4. ExecuteInferenceNode
5. FormatResponseNode
"""

import json
from typing import Dict, Any
from .state import CoachWorkflowState
try:
    from .tools.analytics_tool import AnalyticsTool
    from .models.ollama_provider import OllamaProvider
except ImportError:
    from app.tools.analytics_tool import AnalyticsTool
    from app.models.ollama_provider import OllamaProvider


class ValidateInputNode:
    """Validates incoming match payload structure and data ranges."""

    def run(self, state: CoachWorkflowState) -> CoachWorkflowState:
        data = state.match_data
        if not isinstance(data, dict):
            state.validated = False
            state.validation_error = "Match data must be a JSON dictionary."
            return state

        runs = data.get("runs", 0)
        balls = data.get("balls", 0)
        wickets = data.get("wickets", 0)

        if runs < 0 or balls < 0 or wickets < 0 or wickets > 10:
            state.validated = False
            state.validation_error = "Invalid match statistics: negative numbers or wickets > 10."
            return state

        state.validated = True
        return state


class ProcessAnalyticsNode:
    """Computes deterministic metrics and tactical patterns."""

    def run(self, state: CoachWorkflowState) -> CoachWorkflowState:
        if not state.validated:
            return state

        state.analytics = AnalyticsTool.calculate_metrics(state.match_data)
        return state


class ConstructPromptNode:
    """Builds the instruction prompt for Gemma 4."""

    def run(self, state: CoachWorkflowState) -> CoachWorkflowState:
        if not state.validated:
            return state

        metrics = state.analytics.get("metrics", {})
        patterns = state.analytics.get("patterns", [])

        state.system_prompt = (
            "You are an elite batting coach and tactical analyst for international cricket teams. "
            "You provide data-backed, actionable, encouraging, and highly technical coaching critiques. "
            "Ground all your analysis strictly in the provided match statistics. "
            "Output your critique in structured markdown with the following sections:\n"
            "### 1. Match Performance Summary\n"
            "### 2. Batting Strengths\n"
            "### 3. Vulnerabilities & Tactical Weaknesses\n"
            "### 4. Technical Corrections\n"
            "### 5. Recommended Drills\n"
            "### 6. Next-Match Blueprint\n"
        )

        shot_dist_str = json.dumps(metrics.get("shot_distribution", {}))
        prompt_content = (
            f"Here are the batter's match metrics:\n"
            f"- Total Runs: {metrics.get('runs')} off {metrics.get('balls')} balls\n"
            f"- Strike Rate: {metrics.get('strike_rate')}\n"
            f"- Wickets Lost: {metrics.get('wickets')}\n"
            f"- Dot Balls: {metrics.get('dot_balls')} ({metrics.get('dot_percentage')}% of deliveries)\n"
            f"- Boundaries: {metrics.get('fours')} Fours, {metrics.get('sixes')} Sixes ({metrics.get('boundary_run_percentage')}% of runs)\n"
            f"- Shot Distribution: {shot_dist_str}\n"
            f"- Detected Patterns: {', '.join(patterns) if patterns else 'Balanced display'}\n"
        )

        if state.user_query:
            prompt_content += f"\nPlayer's Specific Question: {state.user_query}\n"

        prompt_content += "\nProvide your comprehensive tactical coaching report:"
        state.prompt = prompt_content
        return state


class ExecuteInferenceNode:
    """Invokes Ollama/Gemma 4 with automatic fallback to verified analytics."""

    def __init__(self, ollama_provider: OllamaProvider):
        self.ollama = ollama_provider

    def run(self, state: CoachWorkflowState) -> CoachWorkflowState:
        if not state.validated:
            return state

        ai_resp = self.ollama.generate(
            prompt=state.prompt,
            system_prompt=state.system_prompt,
            temperature=0.3,
        )

        state.latency_ms = ai_resp["latency_ms"]
        state.is_fallback = ai_resp["is_fallback"]
        state.provider = "gemma4:e2b" if not ai_resp["is_fallback"] else "deterministic-cricket-tactical-engine"

        if not ai_resp["is_fallback"] and ai_resp["text"]:
            state.coach_report = {
                "summary": ai_resp["text"],
                "metrics": state.analytics.get("metrics", {}),
                "patterns": state.analytics.get("patterns", []),
                "corrections": state.analytics.get("corrections", []),
                "drills": state.analytics.get("drills", []),
            }
        else:
            # Deterministic Fallback Coaching Report
            metrics = state.analytics.get("metrics", {})
            patterns = state.analytics.get("patterns", [])
            corrections = state.analytics.get("corrections", [])
            drills = state.analytics.get("drills", [])

            fallback_text = (
                f"### 1. Match Performance Summary\n"
                f"You scored **{metrics.get('runs')} runs** off **{metrics.get('balls')} balls** (Strike Rate: **{metrics.get('strike_rate')}**) losing **{metrics.get('wickets')} wickets**.\n\n"
                f"### 2. Batting Strengths\n"
                f"- Secured {metrics.get('total_boundaries')} boundaries ({metrics.get('fours')} fours, {metrics.get('sixes')} sixes), contributing {metrics.get('boundary_run_percentage')}% of total tally.\n"
                f"- Demonstrating decisive shot intent with average {metrics.get('balls_per_boundary')} balls per boundary.\n\n"
                f"### 3. Vulnerabilities & Tactical Weaknesses\n"
                + "\n".join(f"- {p}" for p in patterns) + "\n\n"
                f"### 4. Technical Corrections\n"
                + "\n".join(f"- {c}" for c in corrections) + "\n\n"
                f"### 5. Recommended Drills\n"
                + "\n".join(f"- **{d['name']}**: {d['focus']} ({d['reps']})" for d in drills) + "\n\n"
                f"### 6. Next-Match Blueprint\n"
                f"Focus on minimizing dot ball percentage below 30% by rotating strike in the initial 12 deliveries before unleashing aggressive boundary options."
            )

            state.coach_report = {
                "summary": fallback_text,
                "metrics": metrics,
                "patterns": patterns,
                "corrections": corrections,
                "drills": drills,
            }

        return state
