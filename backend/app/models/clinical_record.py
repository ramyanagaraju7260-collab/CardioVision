"""
CardioVision AI — Clinical Record Model
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, Boolean, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ClinicalRecord(Base):
    __tablename__ = "clinical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    systolic_bp = Column(Float, nullable=False)
    diastolic_bp = Column(Float, nullable=False)
    cholesterol = Column(Float, nullable=False)
    bmi = Column(Float, nullable=False)
    diabetes = Column(Boolean, nullable=False, default=False)
    smoking_status = Column(String(20), nullable=False, default="never")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    patient = relationship("Patient", back_populates="clinical_records")
    predictions = relationship("Prediction", back_populates="clinical_record")
