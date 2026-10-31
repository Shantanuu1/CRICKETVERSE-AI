"""
Unit tests for Cricket AI Orchestrator components.
Tests AnalyticsTool, RulesRetriever, CommentaryTool, and Workflow.
"""

import os
import sys

# Add app folder to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.tools.analytics_tool import AnalyticsTool
from app.retrieval.rules_retriever import RulesRetriever
from app.models.ollama_provider import OllamaProvider
from app.tools.commentary_tool import CommentaryTool
from app.tools.rules_tool import RulesTool
from app.graph.workflow import CricketCoachWorkflow


def test_analytics_metrics_calculation():
    sample_match = {
        "runs": 48,
        "balls": 24,
        "wickets": 2,
        "fours": 4,
        "sixes": 5,
        "dot_balls": 6,
        "shot_distribution": {
            "defensive": 5,
            "leg_side": 7,
            "off_side": 6,
            "lofted": 6,
        },
    }

    results = AnalyticsTool.calculate_metrics(sample_match)
    metrics = results["metrics"]

    assert metrics["runs"] == 48
    assert metrics["balls"] == 24
    assert metrics["strike_rate"] == 200.0
    assert metrics["total_boundaries"] == 9
    assert metrics["boundary_runs"] == 46  # (4*4) + (5*6) = 16 + 30 = 46
    assert metrics["dot_percentage"] == 25.0
    assert len(results["patterns"]) >= 1
    assert len(results["corrections"]) >= 1
    assert len(results["drills"]) >= 1
    print("[PASS] test_analytics_metrics_calculation passed")


def test_rules_retrieval():
    retriever = RulesRetriever()
    # Test LBW lookup
    lbw_results = retriever.search("What is the LBW rule in cricket?")
    assert len(lbw_results) > 0
    assert "LBW" in lbw_results[0]["name"] or "Leg Before" in lbw_results[0]["name"]

    # Test No-ball lookup
    noball_results = retriever.search("Can you be caught out on a no ball free hit?")
    assert len(noball_results) > 0
    assert "No Ball" in noball_results[0]["name"]
    print("[PASS] test_rules_retrieval passed")


def test_commentary_generation():
    provider = OllamaProvider()
    tool = CommentaryTool(provider)

    four_comm = tool.generate_commentary(event_type="FOUR", runs=4, shot_type="OFF_SIDE_SHOT")
    assert four_comm["event_type"] == "FOUR"
    assert len(four_comm["commentary"]) > 10

    wicket_comm = tool.generate_commentary(event_type="WICKET", runs=0, shot_type="LOFTED_SHOT")
    assert wicket_comm["event_type"] == "WICKET"
    assert len(wicket_comm["commentary"]) > 10
    print("[PASS] test_commentary_generation passed")


def test_coach_workflow_execution():
    provider = OllamaProvider()
    workflow = CricketCoachWorkflow(provider)

    sample_match = {
        "runs": 30,
        "balls": 18,
        "wickets": 1,
        "fours": 2,
        "sixes": 2,
        "dot_balls": 5,
        "shot_distribution": {"defensive": 2, "leg_side": 8, "off_side": 4, "lofted": 4},
    }

    state = workflow.execute(sample_match, user_query="How was my performance?")
    assert state.validated is True
    assert "summary" in state.coach_report
    assert "metrics" in state.coach_report
    assert state.coach_report["metrics"]["runs"] == 30
    print("[PASS] test_coach_workflow_execution passed")


if __name__ == "__main__":
    test_analytics_metrics_calculation()
    test_rules_retrieval()
    test_commentary_generation()
    test_coach_workflow_execution()
    print("\nALL AI ORCHESTRATOR TESTS PASSED SUCCESSFULLY!")
