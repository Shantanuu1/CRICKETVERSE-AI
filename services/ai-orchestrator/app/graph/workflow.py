"""
Coaching Workflow Graph Coordinator.
Executes the sequential nodes with state tracking.
"""

from typing import Dict, Any, Optional
from .state import CoachWorkflowState
from .nodes import (
    ValidateInputNode,
    ProcessAnalyticsNode,
    ConstructPromptNode,
    ExecuteInferenceNode,
)
from ..models.ollama_provider import OllamaProvider


class CricketCoachWorkflow:
    """Pipelines match stats through validation, feature engineering, and inference."""

    def __init__(self, ollama_provider: OllamaProvider):
        self.validator = ValidateInputNode()
        self.analytics_node = ProcessAnalyticsNode()
        self.prompt_node = ConstructPromptNode()
        self.inference_node = ExecuteInferenceNode(ollama_provider)

    def execute(self, match_data: Dict[str, Any], user_query: Optional[str] = None) -> CoachWorkflowState:
        """Runs the complete workflow graph and returns resulting state."""
        state = CoachWorkflowState(match_data=match_data, user_query=user_query)

        # 1. Validation
        state = self.validator.run(state)
        if not state.validated:
            return state

        # 2. Analytics Calculation
        state = self.analytics_node.run(state)

        # 3. Prompt Construction
        state = self.prompt_node.run(state)

        # 4. Inference / Fallback
        state = self.inference_node.run(state)

        return state
