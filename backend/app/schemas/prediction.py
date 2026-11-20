"""
CardioVision AI — Prediction Schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PredictionRequest(BaseModel):
    patient_id: int
    clinical_record_id: int
    retinal_image_id: int


class ProbabilityBreakdown(BaseModel):
    low_risk: float
    medium_risk: Optional[float] = 0.0
    high_risk: float


class ModelInfo(BaseModel):
    name: str
    version: str
    threshold: float


class ExplainabilityInfo(BaseModel):
    gradcam_available: bool
    gradcam_url: Optional[str] = None


class PredictionResponse(BaseModel):
    id: int
    patient_id: int
    patient_code: str
    patient_name: str
    risk_level: str
    risk_probability: float
    probabilities: ProbabilityBreakdown
    model: ModelInfo
    explainability: ExplainabilityInfo
    biomarkers: Optional[dict] = None
    clinical_data: Optional[dict] = None
    retinal_image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionListItem(BaseModel):
    id: int
    patient_id: int
    patient_code: str
    patient_name: str
    risk_level: str
    risk_probability: float
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionListResponse(BaseModel):
    predictions: list[PredictionListItem]
    total: int
