"""
CardioVision AI — Retinal Image Model
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class RetinalImage(Base):
    __tablename__ = "retinal_images"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    quality_status = Column(String(20), default="pending")

    # Relationships
    patient = relationship("Patient", back_populates="retinal_images")
    predictions = relationship("Prediction", back_populates="retinal_image")
