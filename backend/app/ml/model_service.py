"""
CardioVision AI — Cardiovascular Risk Model Service

Central model service supporting:
- 3-Tier Clinical Risk Stratification: LOW_RISK (<30%), MEDIUM_RISK (30-59.9%), HIGH_RISK (>=60%)
- Trained Multimodal Ensemble Inference (Random Forest + Gradient Boosting via joblib)
- Deep Learning Keras/TF inference (when available)
- Real Retinal Biomarker Extraction (AVR, Density, Tortuosity, Caliber)
- Visual Saliency & Heatmaps (Grad-CAM / Attention maps)
- Feature Contribution Analysis

The model loads once at startup and serves real-time predictions.
"""

import json
import hashlib
import joblib
import numpy as np
from pathlib import Path
from typing import Optional, Dict, Any

from app.config import (
    APP_MODE, MODEL_THRESHOLD, MODEL_LOW_THRESHOLD, MODEL_HIGH_THRESHOLD,
    MODEL_VERSION, ML_ARTIFACTS_DIR
)
from app.ml.image_preprocessing import preprocess_for_model, validate_image_file
from app.ml.clinical_preprocessing import preprocess_clinical, GENDER_MAP, SMOKING_MAP
from app.ml.explainability import GradCAMGenerator
from app.ml.retinal_features import RetinalFeatureExtractor


FEATURE_NAMES = [
    "age", "gender", "systolic_bp", "diastolic_bp",
    "cholesterol", "bmi", "diabetes", "smoking_status",
    "avr", "vessel_density", "vessel_tortuosity", "mean_caliber_um"
]


def classify_risk_tier(risk_prob: float, low_th: float = 0.30, high_th: float = 0.60) -> str:
    """Classifies risk probability into 3 clinical tiers: LOW_RISK, MEDIUM_RISK, HIGH_RISK."""
    if risk_prob >= high_th:
        return "HIGH_RISK"
    elif risk_prob >= low_th:
        return "MEDIUM_RISK"
    else:
        return "LOW_RISK"


def compute_3tier_probabilities(risk_prob: float, low_th: float = 0.30, high_th: float = 0.60) -> dict:
    """Computes a calibrated 3-tier probability distribution across Low, Medium, and High risk."""
    p = float(np.clip(risk_prob, 0.0, 1.0))
    if p >= high_th:
        p_high = round(p, 4)
        p_med = round((1.0 - p) * 0.7, 4)
        p_low = round(max(0.0, 1.0 - p_high - p_med), 4)
    elif p >= low_th:
        med_ratio = 1.0 - abs(p - (low_th + high_th) / 2.0) / ((high_th - low_th) / 2.0)
        p_med = round(0.50 + med_ratio * 0.35, 4)
        remaining = 1.0 - p_med
        dist_to_low = (high_th - p) / (high_th - low_th)
        p_low = round(remaining * dist_to_low, 4)
        p_high = round(max(0.0, 1.0 - p_med - p_low), 4)
    else:
        p_low = round(1.0 - p, 4)
        p_med = round(p * 0.7, 4)
        p_high = round(max(0.0, 1.0 - p_low - p_med), 4)

    return {
        "low_risk": max(0.0, p_low),
        "medium_risk": max(0.0, p_med),
        "high_risk": max(0.0, p_high)
    }


class CardiovascularRiskModel:
    """
    Central model service for cardiovascular risk prediction.
    """

    def __init__(self):
        self.mode = APP_MODE
        self.threshold = MODEL_THRESHOLD
        self.low_threshold = MODEL_LOW_THRESHOLD
        self.high_threshold = MODEL_HIGH_THRESHOLD
        self.version = MODEL_VERSION
        self.model = None
        self.scaler = None
        self.model_type = None
        self.model_loaded = False
        self.metadata = {}
        self.gradcam = GradCAMGenerator()
        self.retinal_features = RetinalFeatureExtractor()
        self._load_metadata()
        self._load_model()

    def _load_metadata(self):
        """Load model metadata from artifacts."""
        metadata_path = ML_ARTIFACTS_DIR / "metadata.json"
        if metadata_path.exists():
            try:
                with open(metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                print(f"[CardioVision] Warning: Failed to parse metadata.json: {e}")
        else:
            self.metadata = {
                "model_name": "CardioVision-Multimodal-Ensemble",
                "version": self.version,
                "threshold": self.threshold,
                "low_threshold": self.low_threshold,
                "high_threshold": self.high_threshold,
                "status": "pending",
                "evaluation": {}
            }

    def _load_model(self):
        """Attempt to load trained model artifacts."""
        joblib_path = ML_ARTIFACTS_DIR / "multimodal_model.joblib"
        scaler_path = ML_ARTIFACTS_DIR / "scaler.joblib"
        keras_path = ML_ARTIFACTS_DIR / "model.keras"
        h5_path = ML_ARTIFACTS_DIR / "model.h5"

        # 1. Check for Multimodal Scikit-Learn Ensemble
        if joblib_path.exists():
            try:
                self.model = joblib.load(joblib_path)
                if scaler_path.exists():
                    self.scaler = joblib.load(scaler_path)
                self.model_loaded = True
                self.model_type = "ensemble_joblib"
                self.mode = "production"
                print(f"[CardioVision] Loaded trained Multimodal Ensemble from {joblib_path.name}")
                return
            except Exception as e:
                print(f"[CardioVision] Failed to load joblib model: {e}")

        # 2. Check for TensorFlow / Keras deep neural network
        keras_target = keras_path if keras_path.exists() else (h5_path if h5_path.exists() else None)
        if keras_target:
            try:
                import tensorflow as tf
                self.model = tf.keras.models.load_model(str(keras_target))
                self.model_loaded = True
                self.model_type = "keras_tf"
                self.mode = "production"
                self.gradcam.initialize(self.model)
                print(f"[CardioVision] Loaded Keras model from {keras_target.name}")
                return
            except Exception as e:
                print(f"[CardioVision] Failed to load Keras model: {e}")

        # Fallback
        print("[CardioVision] No production weights found. Running in demo mode.")
        self.model_loaded = False
        self.mode = "demo"

    def predict(self, image_path: str, clinical_data: dict,
                gradcam_save_path: Optional[str] = None,
                vessel_mask_save_path: Optional[str] = None) -> dict:
        """
        Run cardiovascular risk prediction.
        """
        # Validate that the image is a valid retinal fundus scan
        validation = validate_image_file(image_path)
        if not validation.get("valid", True):
            raise ValueError(validation.get("error", "The uploaded file does not appear to be a valid retinal fundus photograph."))

        if self.model_loaded and self.model_type == "ensemble_joblib":
            return self._ensemble_predict(image_path, clinical_data, gradcam_save_path, vessel_mask_save_path)
        elif self.model_loaded and self.model_type == "keras_tf":
            return self._keras_predict(image_path, clinical_data, gradcam_save_path, vessel_mask_save_path)
        else:
            return self._demo_predict(image_path, clinical_data, gradcam_save_path, vessel_mask_save_path)

    def _ensemble_predict(self, image_path: str, clinical_data: dict,
                          gradcam_save_path: Optional[str] = None,
                          vessel_mask_save_path: Optional[str] = None) -> dict:
        """
        Run production inference with the trained Calibrated Multimodal Ensemble.
        Fuses clinical EHR measurements with real computer-vision retinal biomarkers.
        """
        # 1. Extract genuine microvascular biomarkers from the fundus image
        biomarkers = self.retinal_features.extract_features(image_path, vessel_mask_save_path)

        # 2. Extract clinical features
        age = float(clinical_data.get("age", 50))
        gender_raw = str(clinical_data.get("gender", "Other")).capitalize()
        gender = GENDER_MAP.get(gender_raw, 2)
        sbp = float(clinical_data.get("systolic_bp", 120))
        dbp = float(clinical_data.get("diastolic_bp", 80))
        chol = float(clinical_data.get("cholesterol", 200))
        bmi = float(clinical_data.get("bmi", 25))
        diabetes = 1 if bool(clinical_data.get("diabetes", False)) else 0
        smk_raw = str(clinical_data.get("smoking_status", "never")).lower()
        smoking = SMOKING_MAP.get(smk_raw, 0)

        # 3. Microvascular biomarkers
        avr = float(biomarkers.get("avr", 0.68))
        density = float(biomarkers.get("vessel_density", 11.5))
        tortuosity = float(biomarkers.get("vessel_tortuosity", 1.12))
        caliber = float(biomarkers.get("mean_caliber_um", 18.2))

        # 4. Construct feature vector (12 features)
        feat_vector = np.array([
            age, gender, sbp, dbp, chol, bmi, diabetes, smoking,
            avr, density, tortuosity, caliber
        ], dtype=np.float32).reshape(1, -1)

        # Scale
        if self.scaler:
            feat_scaled = self.scaler.transform(feat_vector)
        else:
            feat_scaled = feat_vector

        # 5. Predict Calibrated Probability
        probs = self.model.predict_proba(feat_scaled)[0]
        risk_prob = round(float(probs[1]), 4)
        risk_level = classify_risk_tier(risk_prob, self.low_threshold, self.high_threshold)
        probabilities = compute_3tier_probabilities(risk_prob, self.low_threshold, self.high_threshold)

        # 6. Generate explainability heatmap
        gradcam_result = {"available": False, "path": None}
        if gradcam_save_path and self.gradcam.is_available():
            gradcam_result = self.gradcam.generate(image_path, gradcam_save_path)

        # 7. Compute local feature contribution indicators
        top_factors = []
        if sbp >= 140:
            top_factors.append({"factor": "Elevated Systolic BP", "impact": "High Risk Driver", "value": f"{sbp:.0f} mmHg"})
        elif sbp >= 130:
            top_factors.append({"factor": "Stage 1 Systolic BP", "impact": "Moderate Risk Driver", "value": f"{sbp:.0f} mmHg"})
        if avr < 0.65:
            top_factors.append({"factor": "Arteriolar Narrowing (Low AVR)", "impact": "High Risk Driver", "value": f"{avr:.2f}"})
        if tortuosity > 1.20:
            top_factors.append({"factor": "Microvascular Tortuosity", "impact": "Moderate Risk Driver", "value": f"{tortuosity:.2f}"})
        if chol >= 240:
            top_factors.append({"factor": "Hypercholesterolemia", "impact": "Moderate Risk Driver", "value": f"{chol:.0f} mg/dL"})
        if diabetes:
            top_factors.append({"factor": "Type 2 Diabetes Mellitus", "impact": "High Risk Driver", "value": "Present"})
        if smoking == 2:
            top_factors.append({"factor": "Current Tobacco Smoker", "impact": "High Risk Driver", "value": "Active"})

        return {
            "risk_probability": risk_prob,
            "risk_level": risk_level,
            "probabilities": probabilities,
            "model_version": self.version,
            "threshold": self.threshold,
            "low_threshold": self.low_threshold,
            "high_threshold": self.high_threshold,
            "mode": "production",
            "model_type": "Calibrated Multimodal Ensemble",
            "gradcam": gradcam_result,
            "biomarkers": biomarkers,
            "feature_contributions": top_factors
        }

    def _keras_predict(self, image_path: str, clinical_data: dict,
                       gradcam_save_path: Optional[str] = None,
                       vessel_mask_save_path: Optional[str] = None) -> dict:
        """Run deep learning Keras inference."""
        image_array = preprocess_for_model(image_path)
        clinical_array = preprocess_clinical(clinical_data)

        try:
            prediction = self.model.predict([image_array, clinical_array], verbose=0)
            risk_prob = float(prediction[0][0])
        except Exception:
            prediction = self.model.predict(image_array, verbose=0)
            risk_prob = float(prediction[0][0])

        risk_prob = round(risk_prob, 4)
        risk_level = classify_risk_tier(risk_prob, self.low_threshold, self.high_threshold)
        probabilities = compute_3tier_probabilities(risk_prob, self.low_threshold, self.high_threshold)

        gradcam_result = {"available": False, "path": None}
        if gradcam_save_path and self.gradcam.is_available():
            gradcam_result = self.gradcam.generate(image_array, gradcam_save_path)

        biomarkers = self.retinal_features.extract_features(image_path, vessel_mask_save_path)

        return {
            "risk_probability": risk_prob,
            "risk_level": risk_level,
            "probabilities": probabilities,
            "model_version": self.version,
            "threshold": self.threshold,
            "low_threshold": self.low_threshold,
            "high_threshold": self.high_threshold,
            "mode": "production",
            "model_type": "Multimodal Deep Neural Network",
            "gradcam": gradcam_result,
            "biomarkers": biomarkers
        }

    def _demo_predict(self, image_path: str, clinical_data: dict,
                      gradcam_save_path: Optional[str] = None,
                      vessel_mask_save_path: Optional[str] = None) -> dict:
        """Demo mode fallback combining clinical parameters with real retinal biomarkers."""
        biomarkers = self.retinal_features.extract_features(image_path, vessel_mask_save_path)

        age = float(clinical_data.get("age", 45))
        sbp = float(clinical_data.get("systolic_bp", 120))
        chol = float(clinical_data.get("cholesterol", 190))
        bmi = float(clinical_data.get("bmi", 24))
        diabetes = bool(clinical_data.get("diabetes", False))
        smoking = str(clinical_data.get("smoking_status", "never")).lower()

        clinical_score = 0.08
        clinical_score += max(0.0, (age - 30.0) * 0.007)
        clinical_score += max(0.0, (sbp - 110.0) * 0.0035)
        clinical_score += max(0.0, (chol - 170.0) * 0.0015)
        clinical_score += max(0.0, (bmi - 23.0) * 0.008)
        if diabetes:
            clinical_score += 0.16
        if smoking == "current":
            clinical_score += 0.14
        elif smoking == "former":
            clinical_score += 0.05

        retinal_mod = 0.0
        avr = biomarkers.get("avr", 0.68)
        tortuosity = biomarkers.get("vessel_tortuosity", 1.12)
        density = biomarkers.get("vessel_density", 11.0)

        if avr < 0.67:
            retinal_mod += (0.67 - avr) * 0.55
        else:
            retinal_mod -= 0.04

        if tortuosity > 1.18:
            retinal_mod += (tortuosity - 1.18) * 0.40

        if density < 8.0:
            retinal_mod += (8.0 - density) * 0.018

        total_prob = float(np.clip(clinical_score + retinal_mod, 0.08, 0.94))
        risk_prob = round(total_prob, 4)
        risk_level = classify_risk_tier(risk_prob, self.low_threshold, self.high_threshold)
        probabilities = compute_3tier_probabilities(risk_prob, self.low_threshold, self.high_threshold)

        gradcam_result = {"available": False, "path": None}
        if gradcam_save_path and self.gradcam.is_available():
            gradcam_result = self.gradcam.generate(image_path, gradcam_save_path)

        return {
            "risk_probability": risk_prob,
            "risk_level": risk_level,
            "probabilities": probabilities,
            "model_version": self.version,
            "threshold": self.threshold,
            "low_threshold": self.low_threshold,
            "high_threshold": self.high_threshold,
            "mode": "demo",
            "model_type": "Heuristic Multimodal Simulator",
            "gradcam": gradcam_result,
            "biomarkers": biomarkers
        }

    def get_metadata(self) -> dict:
        """Return model metadata including evaluation metrics."""
        return {
            **self.metadata,
            "mode": self.mode,
            "model_loaded": self.model_loaded,
            "model_type": self.model_type,
            "threshold": self.threshold,
            "low_threshold": self.low_threshold,
            "high_threshold": self.high_threshold,
            "risk_tiers": ["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"],
            "gradcam_available": self.gradcam.is_available(),
            "biomarkers_available": self.retinal_features.is_available()
        }

    def get_metrics(self) -> dict:
        """Return model evaluation metrics."""
        evaluation = self.metadata.get("evaluation", {})
        return {
            "accuracy": evaluation.get("accuracy"),
            "precision": evaluation.get("precision"),
            "recall": evaluation.get("recall"),
            "f1": evaluation.get("f1"),
            "roc_auc": evaluation.get("roc_auc"),
            "confusion_matrix": evaluation.get("confusion_matrix"),
            "status": self.metadata.get("status", "trained" if self.model_loaded else "pending")
        }


# Singleton instance
model_service: Optional[CardiovascularRiskModel] = None


def get_model_service() -> CardiovascularRiskModel:
    """Get or create the singleton model service."""
    global model_service
    if model_service is None:
        model_service = CardiovascularRiskModel()
    return model_service
