"""
Graph State Definitions for CricketVerse AI Workflow.
Supports both Pydantic and standard library dataclasses for maximum compatibility.
"""

from typing import Dict, Any, List, Optional

try:
    from pydantic import BaseModel, Field

    class CoachWorkflowState(BaseModel):
        """Execution state passed across workflow pipeline nodes."""
        match_data: Dict[str, Any] = Field(default_factory=dict)
        user_query: Optional[str] = None
        validated: bool = False
        validation_error: Optional[str] = None
        analytics: Dict[str, Any] = Field(default_factory=dict)
        prompt: Optional[str] = None
        system_prompt: Optional[str] = None
        coach_report: Dict[str, Any] = Field(default_factory=dict)
        is_fallback: bool = False
        provider: str = "unknown"
        latency_ms: float = 0.0

except ImportError:
    from dataclasses import dataclass, field

    @dataclass
    class CoachWorkflowState:
        """Fallback dataclass state when pydantic is not installed."""
        match_data: Dict[str, Any] = field(default_factory=dict)
        user_query: Optional[str] = None
        validated: bool = False
        validation_error: Optional[str] = None
        analytics: Dict[str, Any] = field(default_factory=dict)
        prompt: Optional[str] = None
        system_prompt: Optional[str] = None
        coach_report: Dict[str, Any] = field(default_factory=dict)
        is_fallback: bool = False
        provider: str = "unknown"
        latency_ms: float = 0.0
