"""
Feature Extraction for Hand Landmarks in Cricket Shot Recognition.
Computes finger extension ratios, angles, wrist translation velocities,
and palm elevation to differentiate cricket strokes.
"""

import math
from typing import List, Dict, Any


def euclidean_distance(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """Computes 3D Euclidean distance between two landmark points."""
    dx = p1["x"] - p2["x"]
    dy = p1["y"] - p2["y"]
    dz = p1.get("z", 0.0) - p2.get("z", 0.0)
    return math.sqrt(dx * dx + dy * dy + dz * dz)


class HandFeatureExtractor:
    """Extracts geometric and kinematic features from 21 MediaPipe hand landmarks."""

    # Finger landmark indices: (MCP, PIP, DIP, TIP)
    FINGER_TIPS = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky
    FINGER_PIPS = [2, 6, 10, 14, 18]
    FINGER_MCPS = [1, 5, 9, 13, 17]

    def extract_features(
        self,
        landmarks: List[Dict[str, float]],
        wrist_velocity: Dict[str, float] = None,
    ) -> Dict[str, Any]:
        """
        Extracts high-level features:
        - finger_extensions: list of booleans/ratios indicating whether fingers are extended
        - all_fingers_open: boolean
        - all_fingers_curled: boolean
        - palm_elevation_y: normalized y position of wrist (lower y in camera space is higher physically)
        - wrist_velocity: velocity vector {vx, vy}
        """
        if not landmarks or len(landmarks) < 21:
            return {
                "valid": False,
                "all_fingers_open": False,
                "all_fingers_curled": False,
                "extended_count": 0,
                "palm_elevation_y": 1.0,
                "vx": 0.0,
                "vy": 0.0,
            }

        wrist = landmarks[0]
        extensions = []

        # Thumb extension check: distance from tip (4) to pinky MCP (17) vs thumb MCP (1)
        thumb_tip = landmarks[4]
        thumb_mcp = landmarks[2]
        thumb_extended = thumb_tip["x"] > thumb_mcp["x"] if thumb_tip["x"] > wrist["x"] else thumb_tip["x"] < thumb_mcp["x"]
        extensions.append(thumb_extended)

        # 4 Main fingers: check if tip is farther from wrist than PIP
        for tip_idx, pip_idx in zip(self.FINGER_TIPS[1:], self.FINGER_PIPS[1:]):
            d_tip = euclidean_distance(landmarks[tip_idx], wrist)
            d_pip = euclidean_distance(landmarks[pip_idx], wrist)
            # In image coordinates, lower Y is higher. Also tip distance to wrist is larger when extended.
            is_extended = d_tip > (d_pip * 1.15)
            extensions.append(is_extended)

        extended_count = sum(1 for e in extensions if e)
        all_open = extended_count >= 4
        all_curled = extended_count <= 1

        vx = wrist_velocity.get("vx", 0.0) if wrist_velocity else 0.0
        vy = wrist_velocity.get("vy", 0.0) if wrist_velocity else 0.0

        return {
            "valid": True,
            "extensions": extensions,
            "extended_count": extended_count,
            "all_fingers_open": all_open,
            "all_fingers_curled": all_curled,
            "palm_elevation_y": wrist["y"],  # raw or normalized y
            "vx": vx,
            "vy": vy,
        }
