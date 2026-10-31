"""
Tests for Cricket ML feature extraction and gesture inference.
"""

import sys
import os

# Add parent directory to sys.path so cricket_ml can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from cricket_ml.preprocessing import LandmarkPreprocessor
from cricket_ml.features import HandFeatureExtractor
from cricket_ml.inference import CricketGestureClassifier


def create_mock_open_palm_landmarks(wrist_y=0.6):
    """Creates synthetic 21 landmarks representing an open palm."""
    landmarks = []
    # Wrist (0)
    landmarks.append({"x": 0.5, "y": wrist_y, "z": 0.0})
    # Thumb (1-4)
    landmarks.append({"x": 0.45, "y": wrist_y - 0.05, "z": 0.0})
    landmarks.append({"x": 0.42, "y": wrist_y - 0.10, "z": 0.0})
    landmarks.append({"x": 0.40, "y": wrist_y - 0.15, "z": 0.0})
    landmarks.append({"x": 0.38, "y": wrist_y - 0.20, "z": 0.0})
    # Index (5-8)
    landmarks.append({"x": 0.47, "y": wrist_y - 0.08, "z": 0.0})
    landmarks.append({"x": 0.47, "y": wrist_y - 0.16, "z": 0.0})
    landmarks.append({"x": 0.47, "y": wrist_y - 0.22, "z": 0.0})
    landmarks.append({"x": 0.47, "y": wrist_y - 0.28, "z": 0.0})
    # Middle (9-12)
    landmarks.append({"x": 0.50, "y": wrist_y - 0.09, "z": 0.0})
    landmarks.append({"x": 0.50, "y": wrist_y - 0.18, "z": 0.0})
    landmarks.append({"x": 0.50, "y": wrist_y - 0.25, "z": 0.0})
    landmarks.append({"x": 0.50, "y": wrist_y - 0.32, "z": 0.0})
    # Ring (13-16)
    landmarks.append({"x": 0.53, "y": wrist_y - 0.08, "z": 0.0})
    landmarks.append({"x": 0.53, "y": wrist_y - 0.16, "z": 0.0})
    landmarks.append({"x": 0.53, "y": wrist_y - 0.22, "z": 0.0})
    landmarks.append({"x": 0.53, "y": wrist_y - 0.28, "z": 0.0})
    # Pinky (17-20)
    landmarks.append({"x": 0.56, "y": wrist_y - 0.06, "z": 0.0})
    landmarks.append({"x": 0.56, "y": wrist_y - 0.12, "z": 0.0})
    landmarks.append({"x": 0.56, "y": wrist_y - 0.17, "z": 0.0})
    landmarks.append({"x": 0.56, "y": wrist_y - 0.22, "z": 0.0})
    return landmarks


def create_mock_fist_landmarks(wrist_y=0.6):
    """Creates synthetic 21 landmarks representing a closed fist."""
    landmarks = []
    # Wrist (0)
    landmarks.append({"x": 0.5, "y": wrist_y, "z": 0.0})
    # Thumb curled
    for i in range(1, 5):
        landmarks.append({"x": 0.48, "y": wrist_y - 0.04, "z": 0.0})
    # Index curled
    for i in range(5, 9):
        landmarks.append({"x": 0.49, "y": wrist_y - 0.05, "z": 0.0})
    # Middle curled
    for i in range(9, 13):
        landmarks.append({"x": 0.50, "y": wrist_y - 0.05, "z": 0.0})
    # Ring curled
    for i in range(13, 17):
        landmarks.append({"x": 0.51, "y": wrist_y - 0.05, "z": 0.0})
    # Pinky curled
    for i in range(17, 21):
        landmarks.append({"x": 0.52, "y": wrist_y - 0.04, "z": 0.0})
    return landmarks


def test_preprocessing_and_normalization():
    prep = LandmarkPreprocessor(smoothing_alpha=0.5)
    raw = create_mock_open_palm_landmarks()
    smoothed = prep.smooth(raw)
    assert len(smoothed) == 21
    norm = prep.normalize(smoothed)
    assert len(norm) == 21
    # Wrist should be at origin after normalization
    assert abs(norm[0]["x"]) < 1e-4
    assert abs(norm[0]["y"]) < 1e-4
    print("[PASS] test_preprocessing_and_normalization passed")


def test_open_palm_defensive_classification():
    classifier = CricketGestureClassifier()
    landmarks = create_mock_open_palm_landmarks(wrist_y=0.6)
    result = classifier.classify(landmarks, wrist_velocity={"vx": 0.0, "vy": 0.0})
    assert result["gesture"] == "OPEN_PALM"
    assert result["shot_name"] == "DEFENSIVE_SHOT"
    assert result["is_active_stroke"] is True
    print("[PASS] test_open_palm_defensive_classification passed")


def test_raised_palm_lofted_classification():
    classifier = CricketGestureClassifier()
    # High elevation: wrist_y = 0.2 (low value means top of frame)
    landmarks = create_mock_open_palm_landmarks(wrist_y=0.2)
    result = classifier.classify(landmarks, wrist_velocity={"vx": 0.0, "vy": 0.0})
    assert result["gesture"] == "RAISED_PALM"
    assert result["shot_name"] == "LOFTED_SHOT"
    print("[PASS] test_raised_palm_lofted_classification passed")


def test_closed_fist_leave_classification():
    classifier = CricketGestureClassifier()
    landmarks = create_mock_fist_landmarks(wrist_y=0.6)
    result = classifier.classify(landmarks, wrist_velocity={"vx": 0.0, "vy": 0.0})
    assert result["gesture"] == "CLOSED_FIST"
    assert result["shot_name"] == "LEAVE_BALL"
    print("[PASS] test_closed_fist_leave_classification passed")


def test_swipe_classification():
    classifier = CricketGestureClassifier()
    landmarks = create_mock_open_palm_landmarks(wrist_y=0.6)

    # Left swipe
    res_left = classifier.classify(landmarks, wrist_velocity={"vx": -0.25, "vy": 0.0})
    assert res_left["gesture"] == "SWIPE_LEFT"
    assert res_left["shot_name"] == "LEG_SIDE_SHOT"

    # Right swipe
    res_right = classifier.classify(landmarks, wrist_velocity={"vx": 0.25, "vy": 0.0})
    assert res_right["gesture"] == "SWIPE_RIGHT"
    assert res_right["shot_name"] == "OFF_SIDE_SHOT"
    print("[PASS] test_swipe_classification passed")


if __name__ == "__main__":
    test_preprocessing_and_normalization()
    test_open_palm_defensive_classification()
    test_raised_palm_lofted_classification()
    test_closed_fist_leave_classification()
    test_swipe_classification()
    print("\nALL CRICKET ML TESTS PASSED SUCCESSFULLY!")
