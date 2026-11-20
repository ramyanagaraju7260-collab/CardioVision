"""
CardioVision AI — Report Model
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False, unique=True)
    report_path = Column(String(500), nullable=False)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    prediction = relationship("Prediction", back_populates="report")
