"""
CardioVision AI — Patient Schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    patient_code: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")


class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = Field(None, pattern="^(Male|Female|Other)$")


class PatientResponse(BaseModel):
    id: int
    patient_code: str
    name: str
    age: int
    gender: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    patients: list[PatientResponse]
    total: int
