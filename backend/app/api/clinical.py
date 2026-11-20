"""
CardioVision AI — Clinical Records API Router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.models.clinical_record import ClinicalRecord
from app.schemas.clinical import ClinicalRecordCreate, ClinicalRecordResponse

router = APIRouter()


@router.post("/clinical-records", response_model=ClinicalRecordResponse, status_code=201)
async def create_clinical_record(data: ClinicalRecordCreate, db: Session = Depends(get_db)):
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail={
            "error": "PATIENT_NOT_FOUND",
            "message": f"Patient with ID {data.patient_id} not found."
        })

    record = ClinicalRecord(
        patient_id=data.patient_id,
        systolic_bp=data.systolic_bp,
        diastolic_bp=data.diastolic_bp,
        cholesterol=data.cholesterol,
        bmi=data.bmi,
        diabetes=data.diabetes,
        smoking_status=data.smoking_status
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return ClinicalRecordResponse.model_validate(record)


@router.get("/clinical-records/{record_id}", response_model=ClinicalRecordResponse)
async def get_clinical_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ClinicalRecord).filter(ClinicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail={
            "error": "RECORD_NOT_FOUND",
            "message": f"Clinical record with ID {record_id} not found."
        })
    return ClinicalRecordResponse.model_validate(record)
