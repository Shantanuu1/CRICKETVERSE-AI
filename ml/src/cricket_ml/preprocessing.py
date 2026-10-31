"""
MediaPipe Hand Landmarks Preprocessing Pipeline for Cricket Gesture Recognition.
Transforms raw 21 3D landmark points (x, y, z) into scale-invariant,
centered coordinates for robust shot classification.
"""

import math
from typing import List, Dict, Any, Tuple


class LandmarkPreprocessor:
    """Preprocesses raw MediaPipe 21 hand landmarks."""

    WRIST_INDEX = 0
    MIDDLE_MCP_INDEX = 9

    def __init__(self, smoothing_alpha: float = 0.35):
        self.smoothing_alpha = smoothing_alpha
        self.prev_landmarks: List[Dict[str, float]] = []

    def smooth(self, raw_landmarks: List[Dict[str, float]]) -> List[Dict[str, float]]:
        """Applies Exponential Moving Average (EMA) smoothing over consecutive frames."""
        if not raw_landmarks:
            return []

        if not self.prev_landmarks or len(self.prev_landmarks) != len(raw_landmarks):
            self.prev_landmarks = [dict(lm) for lm in raw_landmarks]
            return self.prev_landmarks

        smoothed = []
        for curr, prev in zip(raw_landmarks, self.prev_landmarks):
            sm = {
                "x": self.smoothing_alpha * curr["x"] + (1 - self.smoothing_alpha) * prev["x"],
                "y": self.smoothing_alpha * curr["y"] + (1 - self.smoothing_alpha) * prev["y"],
                "z": self.smoothing_alpha * curr.get("z", 0.0) + (1 - self.smoothing_alpha) * prev.get("z", 0.0),
            }
            smoothed.append(sm)

        self.prev_landmarks = smoothed
        return smoothed

    def normalize(self, landmarks: List[Dict[str, float]]) -> List[Dict[str, float]]:
        """
        Translates wrist to origin (0,0,0) and scales by the distance
        between the wrist and middle finger MCP joint (palm reference scale).
        """
        if not landmarks or len(landmarks) < 21:
            return landmarks

        wrist = landmarks[self.WRIST_INDEX]
        middle_mcp = landmarks[self.MIDDLE_MCP_INDEX]

        # Calculate palm reference scale
        dx = middle_mcp["x"] - wrist["x"]
        dy = middle_mcp["y"] - wrist["y"]
        dz = middle_mcp.get("z", 0.0) - wrist.get("z", 0.0)
        scale = math.sqrt(dx * dx + dy * dy + dz * dz)
        if scale < 1e-4:
            scale = 1.0

        normalized = []
        for lm in landmarks:
            normalized.append({
                "x": (lm["x"] - wrist["x"]) / scale,
                "y": (lm["y"] - wrist["y"]) / scale,
                "z": (lm.get("z", 0.0) - wrist.get("z", 0.0)) / scale,
            })
        return normalized

    def reset(self):
        """Resets temporal smoothing history."""
        self.prev_landmarks = []
