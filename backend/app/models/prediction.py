"""
CardioVision AI — Prediction Model
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    clinical_record_id = Column(Integer, ForeignKey("clinical_records.id"), nullable=False)
    retinal_image_id = Column(Integer, ForeignKey("retinal_images.id"), nullable=False)
    risk_probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    model_version = Column(String(20), nullable=False)
    threshold = Column(Float, nullable=False)
    gradcam_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    patient = relationship("Patient", back_populates="predictions")
    clinical_record = relationship("ClinicalRecord", back_populates="predictions")
    retinal_image = relationship("RetinalImage", back_populates="predictions")
    report = relationship("Report", back_populates="prediction", uselist=False, cascade="all, delete-orphan")
