# AI ORCHESTRATION & WORKFLOW PIPELINE

## 1. Overview
The AI Orchestration layer coordinates Google Gemma 4 inference, structured prompt assembly, match analytics calculation, and knowledge retrieval. It is implemented in `services/ai-orchestrator` with a dual-engine architecture:
- FastAPI (when installed in virtualenv)
- Python Standard Library `http.server` (when dependencies are minimal)

This guarantees 100% execution reliability on any developer system.

---

## 2. Pipeline Execution Graph

```
Incoming Request (Match Data JSON)
                 |
                 v
      [1. ValidateInputNode]
      * Verify numbers >= 0
      * Check wickets <= 10
      * Validate structure
                 |
                 +---> [Invalid] ---> 400 Bad Request
                 |
                 v [Valid]
    [2. ProcessAnalyticsNode]
    * Strike Rate = (Runs / Balls) * 100
    * Dot Ball Ratio = (Dots / Balls) * 100
    * Boundary Run Contribution %
    * Shot Distribution Breakdown
                 |
                 v
     [3. ConstructPromptNode]
     * System Prompt: Elite Cricket Technical Coach
     * User Payload: Exact match metrics
     * Technical constraints & structured markdown schema
                 |
                 v
     [4. ExecuteInferenceNode]
     * Try Ollama /api/generate (gemma4:e2b)
     * Measure precise latency (ms)
                 |
        +--------+--------+
        |                 |
  [Ollama Online]   [Ollama Offline / Timeout]
        |                 |
  Parse Gemma Text  Generate Calibrated Fallback
        |                 |
        +--------+--------+
                 |
                 v
     [5. FormatResponseNode]
     * Attach structured metrics
     * Attach evidence observations
     * Attach technical corrections & drills
     * Attach accurate telemetry
```

---

## 3. Tool Implementations

### AnalyticsTool (`app/tools/analytics_tool.py`)
Computes:
- `strike_rate`: Batting tempo.
- `dot_percentage`: Ratio of non-scoring deliveries.
- `boundary_run_percentage`: Runs scored via 4s and 6s vs total runs.
- `balls_per_boundary`: Frequency of boundary impacts.
- `patterns`: Automatically flags tactical risks (e.g., dot pressure > 40%, on-side bias > 50%).

### CommentaryTool (`app/tools/commentary_tool.py`)
Generates broadcast commentary across 6 match states:
- `DOT`: Focuses on good length bowling, seam movement, and defensive leaves.
- `SINGLE`: Focuses on soft hands, gap finding, and quick running.
- `DOUBLE`: Focuses on aggressive outfield placement and turn speed.
- `FOUR`: Focuses on cover drives, pull shots, and crisp timing.
- `SIX`: Focuses on high backlift, launch angle, and maximum distance into the stands.
- `WICKET`: Focuses on shattered stumps, edges to slips, and boundary catches.

### RulesTool & RulesRetriever (`app/tools/rules_tool.py`)
Executes token-based and keyword-ranked retrieval over `data/rules/processed/cricket_rules.json`. Matches queries regarding LBW, No-balls, Wides, Powerplays, and Dismissals, then prompts Gemma to formulate an accessible explanation citing verified conditions.
