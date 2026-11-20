"""
CardioVision AI — Utility Helpers
"""

import uuid
from sqlalchemy.orm import Session
from app.models.patient import Patient


from typing import Optional

def generate_patient_code(db: Optional[Session] = None) -> str:
    """Generate the next sequential patient code (P00001, P00002, ...)."""
    if db is not None:
        last_patient = db.query(Patient).order_by(Patient.id.desc()).first()
        next_num = (last_patient.id + 1) if last_patient else 1
        return f"P{next_num:05d}"
    return f"P{uuid.uuid4().hex[:6].upper()}"


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique server-side filename preserving the extension."""
    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "png"
    return f"{uuid.uuid4().hex}.{ext}"
