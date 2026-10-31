"""
Cricket Commentary Tool.
Synthesizes professional, dynamic cricket broadcast commentary for match events
(dot, single, double, four, six, wicket) via Gemma 4, with robust rule-based
fallbacks when Ollama is offline.
"""

import random
from typing import Dict, Any, Optional
try:
    from ..models.ollama_provider import OllamaProvider
except ImportError:
    from app.models.ollama_provider import OllamaProvider


class CommentaryTool:
    """Generates broadcast commentary with broadcast styles (Richie Benaud, Ian Bishop, Harsha Bhogle vibes)."""

    FALLBACK_COMMENTARY = {
        "DOT": [
            "Good length delivery outside off, the batter shoulders arms with supreme judgment.",
            "Pitched right on the money! Defended solidly right back down the track to the bowler.",
            "Beaten by the seam movement! Whistles past the outside edge into the keeper's gloves.",
            "Tidy bowling. Pushed gently into the covers, no run there as the fielders swarm in.",
            "Dot ball! The bowler stares down the pitch, tightening the screws in this over.",
        ],
        "SINGLE": [
            "Nudged deftly into the gap at mid-wicket, and they sprint through for a sharp single.",
            "Pushed softly with supple wrists down towards third man, comfortable single taken.",
            "Worked away off the pads into the square leg region. Good running between the wickets.",
            "Dropped right at the batter's feet, quick call 'YES!' and they hustle across effortlessly.",
        ],
        "DOUBLE": [
            "Clipped nicely through mid-wicket! They hurry back for the second and make it safely.",
            "Driven into the deep cover pocket! Excellent running, putting pressure on the fielder's arm.",
            "Punched off the back foot through point! The fielder chases it down, but that's a brace.",
        ],
        "FOUR": [
            "CRACK! What an exquisite cover drive! The fielder didn't even move, racing to the fence!",
            "Glorious timing! Leaned into the half-volley and pierced the infield like a tracer bullet for FOUR!",
            "Short and dispatched! Pulled fiercely through mid-wicket, bouncing into the boundary cushions!",
            "Delicate touch! Opened the face of the bat late and guided past backward point for four runs!",
        ],
        "SIX": [
            "INTO THE STRATOSPHERE! Launched straight down the ground, sailing deep into the stands!",
            "HE HAS HIT THAT A MILE! Magnificent pickup shot off the hips, high, handsome, and OUT OF HERE!",
            "STAND AND DELIVER! Swung cleanly through the line of the ball, 95 meters over wide long-on!",
            "BOOM! Pure power hitting! That one has cleared the roof of the stadium, what a majestic six!",
        ],
        "WICKET": [
            "BOWLED HIM! The off-stump goes cartwheeling through the air! Absolute peach of a delivery!",
            "GONE! Edged and taken! Flying grab by the wicket-keeper, a monumental breakthrough!",
            "CAUGHT IN THE DEEP! Went for the aerial loft, mistimed it off the toe-end, and taken safely on the boundary!",
            "TIMBER! What a delivery! Clean through the gate, shattering the stumps! The batter must walk!",
        ],
    }

    def __init__(self, ollama_provider: OllamaProvider):
        self.ollama = ollama_provider

    def generate_commentary(
        self,
        event_type: str,
        runs: int = 0,
        shot_type: str = "SHOT",
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generates contextual commentary.
        Uses Gemma 4 if available; otherwise selects from calibrated fallback engine.
        """
        event_key = event_type.upper()
        if event_key not in self.FALLBACK_COMMENTARY:
            event_key = "SINGLE" if runs == 1 else ("FOUR" if runs == 4 else ("SIX" if runs == 6 else "DOT"))

        ctx_str = ""
        if context:
            ctx_str = f"Score: {context.get('score', 0)}/{context.get('wickets', 0)}, Over: {context.get('overs', '0.0')}, Target: {context.get('target', 'N/A')}."

        system_prompt = (
            "You are a legendary international cricket commentator (in the style of Richie Benaud and Ian Bishop). "
            "Deliver a single punchy, vivid, dramatic 1-2 sentence sentence commentary reaction for this live cricket ball. "
            "Do not output markdown headings, commentary notes, or quotes. Just the broadcast sentence."
        )

        prompt = (
            f"Event: {event_key}. Runs scored: {runs}. Shot played: {shot_type}. {ctx_str} "
            f"Provide live ball broadcast commentary:"
        )

        # Attempt Ollama inference
        ai_resp = self.ollama.generate(prompt=prompt, system_prompt=system_prompt, temperature=0.7)

        if not ai_resp["is_fallback"] and ai_resp["text"]:
            return {
                "commentary": ai_resp["text"].strip().replace('"', ''),
                "is_fallback": False,
                "provider": "gemma4:e2b",
                "event_type": event_key,
                "latency_ms": ai_resp["latency_ms"],
            }

        # Fallback commentary
        fallback_text = random.choice(self.FALLBACK_COMMENTARY.get(event_key, self.FALLBACK_COMMENTARY["DOT"]))
        return {
            "commentary": fallback_text,
            "is_fallback": True,
            "provider": "deterministic-cricket-commentary-engine",
            "event_type": event_key,
            "latency_ms": ai_resp["latency_ms"],
        }
