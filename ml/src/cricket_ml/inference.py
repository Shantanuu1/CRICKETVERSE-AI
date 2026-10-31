"""
Cricket Gesture Inference Engine.
Maps extracted hand kinematic features and landmarks into canonical cricket batting actions:
- OPEN_PALM  -> DEFENSIVE SHOT
- SWIPE_LEFT -> LEG-SIDE SHOT
- SWIPE_RIGHT-> OFF-SIDE SHOT
- RAISED_PALM-> LOFTED SHOT
- CLOSED_FIST-> LEAVE BALL
- NEUTRAL    -> READY / WAITING
"""

from typing import Dict, Any, List
from .preprocessing import LandmarkPreprocessor
from .features import HandFeatureExtractor


class CricketGestureClassifier:
    """Classifies cricket batting gestures from 21 MediaPipe hand landmarks."""

    GESTURES = [
        "OPEN_PALM",
        "SWIPE_LEFT",
        "SWIPE_RIGHT",
        "RAISED_PALM",
        "CLOSED_FIST",
        "NEUTRAL",
    ]

    def __init__(
        self,
        swipe_threshold: float = 0.08,
        raised_threshold_y: float = 0.35,
        smoothing_alpha: float = 0.35,
    ):
        self.swipe_threshold = swipe_threshold
        self.raised_threshold_y = raised_threshold_y
        self.preprocessor = LandmarkPreprocessor(smoothing_alpha=smoothing_alpha)
        self.feature_extractor = HandFeatureExtractor()

    def classify(
        self,
        landmarks: List[Dict[str, float]],
        wrist_velocity: Dict[str, float] = None,
    ) -> Dict[str, Any]:
        """
        Classifies current frame landmarks into a cricket action with confidence.
        """
        if not landmarks or len(landmarks) < 21:
            return {
                "gesture": "NEUTRAL",
                "shot_name": "WAITING_FOR_DELIVERY",
                "confidence": 0.0,
                "is_active_stroke": False,
                "details": "No valid hand landmarks detected",
            }

        smoothed = self.preprocessor.smooth(landmarks)
        features = self.feature_extractor.extract_features(smoothed, wrist_velocity)

        vx = features["vx"]
        vy = features["vy"]
        wrist_y = landmarks[0]["y"]

        # 1. Check for lateral swipes (swipe left / swipe right)
        if abs(vx) > self.swipe_threshold:
            if vx < -self.swipe_threshold:
                # Moving left in video space (mirror view: player's right, leg side or off side depending on stance)
                return {
                    "gesture": "SWIPE_LEFT",
                    "shot_name": "LEG_SIDE_SHOT",
                    "confidence": min(0.98, 0.70 + abs(vx)),
                    "is_active_stroke": True,
                    "details": f"Rapid lateral hand sweep left (vx={vx:.2f})",
                }
            elif vx > self.swipe_threshold:
                return {
                    "gesture": "SWIPE_RIGHT",
                    "shot_name": "OFF_SIDE_SHOT",
                    "confidence": min(0.98, 0.70 + abs(vx)),
                    "is_active_stroke": True,
                    "details": f"Rapid lateral hand sweep right (vx={vx:.2f})",
                }

        # 2. Check for raised open palm (Lofted Shot)
        # Note: In webcam coordinate systems, Y=0 is the top of the frame.
        # So wrist_y < raised_threshold_y means hand is held high up.
        if features["all_fingers_open"] and wrist_y < self.raised_threshold_y:
            return {
                "gesture": "RAISED_PALM",
                "shot_name": "LOFTED_SHOT",
                "confidence": 0.94,
                "is_active_stroke": True,
                "details": f"High elevated open palm (y={wrist_y:.2f})",
            }

        # 3. Check for closed fist (Leave Ball)
        if features["all_fingers_curled"]:
            return {
                "gesture": "CLOSED_FIST",
                "shot_name": "LEAVE_BALL",
                "confidence": 0.92,
                "is_active_stroke": True,
                "details": "Fist tightly clenched; presenting no bat face",
            }

        # 4. Check for steady open palm (Defensive Shot)
        if features["all_fingers_open"]:
            return {
                "gesture": "OPEN_PALM",
                "shot_name": "DEFENSIVE_SHOT",
                "confidence": 0.88,
                "is_active_stroke": True,
                "details": "Open flat palm facing forward; straight bat block",
            }

        return {
            "gesture": "NEUTRAL",
            "shot_name": "WAITING_FOR_DELIVERY",
            "confidence": 0.50,
            "is_active_stroke": False,
            "details": "Neutral ready stance",
        }
