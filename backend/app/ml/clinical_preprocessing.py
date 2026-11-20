"""
CardioVision AI — Clinical Data Preprocessing

Handles clinical feature transformation:
- Validation
- Categorical encoding
- Scaling / normalization
- Feature vector assembly
"""

import numpy as np


# Encoding maps (must match training preprocessing)
GENDER_MAP = {"Male": 0, "Female": 1, "Other": 2}
SMOKING_MAP = {"never": 0, "former": 1, "current": 2}

# Feature order for the model input (must match training)
FEATURE_ORDER = [
    "age", "gender", "systolic_bp", "diastolic_bp",
    "cholesterol", "bmi", "diabetes", "smoking_status"
]

# Default normalization ranges (used in demo mode or if scaler.pkl is absent)
# In production, these should come from a fitted scaler
FEATURE_RANGES = {
    "age": (1, 120),
    "gender": (0, 2),
    "systolic_bp": (50, 300),
    "diastolic_bp": (30, 250),
    "cholesterol": (50, 600),
    "bmi": (10, 80),
    "diabetes": (0, 1),
    "smoking_status": (0, 2),
}


def encode_clinical_data(clinical_data: dict) -> dict:
    """Encode categorical clinical features to numeric values."""
    encoded = clinical_data.copy()
    encoded["gender"] = GENDER_MAP.get(clinical_data.get("gender", "Other"), 2)
    encoded["smoking_status"] = SMOKING_MAP.get(clinical_data.get("smoking_status", "never"), 0)
    encoded["diabetes"] = int(clinical_data.get("diabetes", False))
    return encoded


def normalize_features(encoded_data: dict) -> np.ndarray:
    """
    Min-max normalize features to [0, 1].
    In production, this would use a fitted sklearn scaler.
    """
    values = []
    for feature in FEATURE_ORDER:
        val = float(encoded_data.get(feature, 0))
        min_val, max_val = FEATURE_RANGES[feature]
        if max_val - min_val > 0:
            normalized = (val - min_val) / (max_val - min_val)
        else:
            normalized = 0.0
        values.append(np.clip(normalized, 0.0, 1.0))
    return np.array(values, dtype=np.float32)


def preprocess_clinical(clinical_data: dict) -> np.ndarray:
    """
    Full clinical preprocessing pipeline.
    Returns a numpy array of shape (1, num_features).
    """
    encoded = encode_clinical_data(clinical_data)
    normalized = normalize_features(encoded)
    return np.expand_dims(normalized, axis=0)
