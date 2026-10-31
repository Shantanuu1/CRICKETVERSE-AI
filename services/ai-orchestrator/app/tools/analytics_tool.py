"""
Analytics Tool for Cricket Match Intelligence.
Calculates deterministic batting metrics, strike rates, risk distribution,
and shot bias from real gameplay statistics.
"""

from typing import Dict, Any, List


class AnalyticsTool:
    """Computes verified cricket match analytics and tactical insights."""

    @staticmethod
    def calculate_metrics(match_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates comprehensive batting metrics:
        - strike_rate: (runs / balls) * 100
        - dot_ball_ratio: dot_balls / balls
        - boundary_run_ratio: (fours*4 + sixes*6) / runs
        - balls_per_boundary: balls / (fours + sixes)
        - shot_distribution_pct: percentage for each shot
        """
        runs = int(match_data.get("runs", 0))
        balls = int(match_data.get("balls", 0))
        wickets = int(match_data.get("wickets", 0))
        fours = int(match_data.get("fours", 0))
        sixes = int(match_data.get("sixes", 0))
        dot_balls = int(match_data.get("dot_balls", 0))
        shot_dist = match_data.get("shot_distribution", {})

        strike_rate = round((runs / balls * 100), 2) if balls > 0 else 0.0
        dot_pct = round((dot_balls / balls * 100), 1) if balls > 0 else 0.0
        total_boundaries = fours + sixes
        boundary_runs = (fours * 4) + (sixes * 6)
        boundary_run_pct = round((boundary_runs / runs * 100), 1) if runs > 0 else 0.0
        balls_per_boundary = round(balls / total_boundaries, 1) if total_boundaries > 0 else float(balls)

        total_shots = sum(shot_dist.values()) if shot_dist else 0
        shot_percentages = {}
        for shot, count in shot_dist.items():
            shot_percentages[shot] = round((count / total_shots * 100), 1) if total_shots > 0 else 0.0

        # Pattern Recognition & Tactical Signals
        patterns = []
        if dot_pct >= 40.0:
            patterns.append(f"High dot-ball accumulation ({dot_pct}% of deliveries yielded 0 runs).")
        if shot_percentages.get("lofted", 0) > 35.0:
            patterns.append(f"High aerial risk: {shot_percentages.get('lofted')}% lofted strokes.")
        if shot_percentages.get("leg_side", 0) > 50.0:
            patterns.append(f"Heavy on-side bias: {shot_percentages.get('leg_side')}% played to leg side.")
        if shot_percentages.get("off_side", 0) > 50.0:
            patterns.append(f"Heavy off-side bias: {shot_percentages.get('off_side')}% played through off side.")
        if strike_rate >= 180.0:
            patterns.append(f"Exceptional scoring velocity (Strike Rate: {strike_rate}).")

        # Deterministic Tactical Corrections
        corrections = []
        if dot_pct >= 35.0:
            corrections.append("Rotate strike with quick push singles on good-length balls instead of blocking.")
        if shot_percentages.get("lofted", 0) > 30.0 and wickets >= 2:
            corrections.append("Keep shots grounded along the carpet when fielders are positioned on the boundary.")
        if shot_percentages.get("leg_side", 0) > 45.0:
            corrections.append("Open batting stance slightly to access the cover-drive and off-side gaps.")
        if not corrections:
            corrections.append("Maintain existing shot selection rhythm while expanding boundary targeting in death overs.")

        # Recommended Drills
        drills = []
        if dot_pct >= 35.0:
            drills.append({
                "name": "Strike Rotation Grid",
                "focus": "Singles & Drop-and-Run",
                "reps": "3 sets of 12 balls with soft hands",
            })
        if shot_percentages.get("lofted", 0) > 30.0:
            drills.append({
                "name": "High Elbow Grounded Drives",
                "focus": "Keeping bat face controlled through contact",
                "reps": "25 drives through cone gates on the off-side",
            })
        if shot_percentages.get("leg_side", 0) > 40.0:
            drills.append({
                "name": "Off-Side Extension Drill",
                "focus": "Transferring weight towards cover and point",
                "reps": "20 cover-drives against half-volleys",
            })
        if not drills:
            drills.append({
                "name": "Power Hitting Zone Drill",
                "focus": "Maximizing launch angle on slot deliveries",
                "reps": "15 balls focusing on clean bat swing speed",
            })

        return {
            "metrics": {
                "runs": runs,
                "balls": balls,
                "wickets": wickets,
                "fours": fours,
                "sixes": sixes,
                "dot_balls": dot_balls,
                "strike_rate": strike_rate,
                "dot_percentage": dot_pct,
                "total_boundaries": total_boundaries,
                "boundary_runs": boundary_runs,
                "boundary_run_percentage": boundary_run_pct,
                "balls_per_boundary": balls_per_boundary,
                "shot_distribution": shot_dist,
                "shot_percentages": shot_percentages,
            },
            "patterns": patterns,
            "corrections": corrections,
            "drills": drills,
        }
