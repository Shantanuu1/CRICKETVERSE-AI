"""
Cricket Rules Assistant Tool.
Coordinates rules retrieval and natural language explanation via Gemma 4.
"""

from typing import Dict, Any, List
try:
    from ..retrieval.rules_retriever import RulesRetriever
    from ..models.ollama_provider import OllamaProvider
except ImportError:
    from app.retrieval.rules_retriever import RulesRetriever
    from app.models.ollama_provider import OllamaProvider


class RulesTool:
    """Answers user cricket rules inquiries using verified MCC knowledge and Gemma 4."""

    def __init__(self, ollama_provider: OllamaProvider, rules_retriever: RulesRetriever):
        self.ollama = ollama_provider
        self.retriever = rules_retriever

    def answer_question(self, user_question: str) -> Dict[str, Any]:
        """
        Retrieves matching cricket laws, then prompts Gemma to explain it in accessible terms.
        Falls back to structured law details if Gemma/Ollama is offline.
        """
        matched_rules = self.retriever.search(user_question, top_k=2)

        if not matched_rules:
            # Fallback when no specific rule matches query
            return {
                "answer": "Cricket laws are codified by the MCC (Marylebone Cricket Club) and ICC. I could not locate a specific clause matching your exact query. Please ask about LBW, No-balls, Wides, Free hits, Powerplays, Overs, or Dismissals.",
                "matched_rules": [],
                "is_fallback": True,
                "provider": "cricket-rules-knowledge-base",
                "latency_ms": 0.0,
            }

        primary_rule = matched_rules[0]
        context_text = f"Law Name: {primary_rule['name']}\nSummary: {primary_rule['summary']}\nConditions:\n" + "\n".join(f"- {c}" for c in primary_rule.get("conditions", [])) + f"\nTactical Tip: {primary_rule.get('tactical_tip', '')}"

        system_prompt = (
            "You are an expert official ICC cricket umpire and rules analyst. "
            "Explain the cricket rule accurately and concisely in 2-3 engaging paragraphs. "
            "Use only the verified rule information provided in the context. Do not invent rules. "
            "Always include the tactical tip provided."
        )

        prompt = (
            f"User Question: {user_question}\n\n"
            f"Verified Rule Context:\n{context_text}\n\n"
            f"Explain this clearly to the player:"
        )

        ai_resp = self.ollama.generate(prompt=prompt, system_prompt=system_prompt, temperature=0.2)

        if not ai_resp["is_fallback"] and ai_resp["text"]:
            return {
                "answer": ai_resp["text"],
                "matched_rules": matched_rules,
                "is_fallback": False,
                "provider": "gemma4:e2b",
                "latency_ms": ai_resp["latency_ms"],
            }

        # Structured fallback explanation when Gemma is offline
        fallback_text = (
            f"### {primary_rule['name']} ({primary_rule.get('category', 'Cricket Law')})\n\n"
            f"{primary_rule['summary']}\n\n"
            f"**Key Regulations & Conditions:**\n"
            + "\n".join(f"- {c}" for c in primary_rule.get("conditions", []))
            + f"\n\n**Tactical Advice:**\n{primary_rule.get('tactical_tip', 'Keep your fundamentals steady.')}\n\n"
            f"*(Note: Curated MCC rule fallback delivered while local Gemma 4 runtime is offline.)*"
        )

        return {
            "answer": fallback_text,
            "matched_rules": matched_rules,
            "is_fallback": True,
            "provider": "deterministic-rules-retriever",
            "latency_ms": ai_resp["latency_ms"],
        }
