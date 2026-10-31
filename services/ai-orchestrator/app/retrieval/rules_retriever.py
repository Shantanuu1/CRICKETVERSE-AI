"""
Cricket Rules Knowledge Retriever.
Loads structured cricket rules from data/rules/processed/cricket_rules.json
and executes ranked keyword/term retrieval.
"""

import json
import os
import re
from typing import List, Dict, Any, Optional


class RulesRetriever:
    """Retrieves verified MCC cricket laws and playing conditions."""

    def __init__(self, rules_file_path: Optional[str] = None):
        if not rules_file_path:
            # Locate relative to project root
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
            rules_file_path = os.path.join(base_dir, "data", "rules", "processed", "cricket_rules.json")

        self.rules_file_path = rules_file_path
        self.rules: List[Dict[str, Any]] = []
        self._load_rules()

    def _load_rules(self):
        """Loads rules database from disk."""
        if os.path.exists(self.rules_file_path):
            try:
                with open(self.rules_file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.rules = data.get("rules", [])
            except Exception as e:
                print(f"[RulesRetriever] Error loading rules from {self.rules_file_path}: {e}")
                self.rules = []
        else:
            print(f"[RulesRetriever] Rules file not found at {self.rules_file_path}")
            self.rules = []

    def search(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Ranked keyword and token matching against rule titles, summaries, and categories.
        """
        if not self.rules or not query:
            return []

        tokens = set(re.findall(r"\w+", query.lower()))
        scored_rules = []

        for rule in self.rules:
            score = 0
            name_tokens = set(re.findall(r"\w+", rule["name"].lower()))
            summary_tokens = set(re.findall(r"\w+", rule["summary"].lower()))
            category_tokens = set(re.findall(r"\w+", rule.get("category", "").lower()))

            # Exact phrase matches
            if rule["name"].lower() in query.lower():
                score += 20
            # Common acronyms
            if "lbw" in query.lower() and "lbw" in rule["id"]:
                score += 30
            if "powerplay" in query.lower() and "powerplay" in rule["id"]:
                score += 30
            if "no ball" in query.lower() and "no_ball" in rule["id"]:
                score += 30
            if "wide" in query.lower() and "wide" in rule["id"]:
                score += 30
            if "strike rate" in query.lower() and "strike_rate" in rule["id"]:
                score += 30

            score += len(tokens.intersection(name_tokens)) * 5
            score += len(tokens.intersection(summary_tokens)) * 2
            score += len(tokens.intersection(category_tokens)) * 3

            if score > 0:
                scored_rules.append((score, rule))

        scored_rules.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_rules[:top_k]]

    def get_all_rules(self) -> List[Dict[str, Any]]:
        """Returns all loaded rules."""
        return self.rules
