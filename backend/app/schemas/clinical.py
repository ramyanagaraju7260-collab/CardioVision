"""
CardioVision AI — Clinical Record Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class ClinicalRecordCreate(BaseModel):
    patient_id: int
    systolic_bp: float = Field(..., gt=0, le=300)
    diastolic_bp: float = Field(..., gt=0, le=250)
    cholesterol: float = Field(..., gt=0, le=600)
    bmi: float = Field(..., gt=0, le=80)
    diabetes: bool = False
    smoking_status: str = Field(default="never", pattern="^(never|former|current)$")

    @field_validator("diastolic_bp")
    @classmethod
    def validate_bp(cls, v, info):
        systolic = info.data.get("systolic_bp")
        if systolic is not None and v > systolic:
            raise ValueError("Diastolic BP should generally not exceed systolic BP")
        return v


class ClinicalRecordResponse(BaseModel):
    id: int
    patient_id: int
    systolic_bp: float
    diastolic_bp: float
    cholesterol: float
    bmi: float
    diabetes: bool
    smoking_status: str
    created_at: datetime

    class Config:
        from_attributes = True
