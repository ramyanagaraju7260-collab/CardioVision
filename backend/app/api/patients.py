"""
CardioVision AI — Patient API Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pathlib import Path
from datetime import datetime, timezone

from app.database import get_db
from app.config import UPLOAD_DIR
from app.models.patient import Patient
from app.models.prediction import Prediction
from app.models.clinical_record import ClinicalRecord
from app.models.retinal_image import RetinalImage
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientListResponse
from app.utils.helpers import generate_patient_code, generate_unique_filename
from app.ml.model_service import get_model_service
from app.ml.retinal_features import RetinalFeatureExtractor

router = APIRouter()


@router.get("/patients", response_model=PatientListResponse)
async def list_patients(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    if search:
        query = query.filter(
            (Patient.name.ilike(f"%{search}%")) |
            (Patient.patient_code.ilike(f"%{search}%"))
        )
    total = query.count()
    patients = query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()
    return PatientListResponse(
        patients=[PatientResponse.model_validate(p) for p in patients],
        total=total
    )


@router.post("/patients", response_model=PatientResponse, status_code=201)
async def create_patient(patient_data: PatientCreate, db: Session = Depends(get_db)):
    code = getattr(patient_data, "patient_code", None) or generate_patient_code(db)
    existing = db.query(Patient).filter(Patient.patient_code == code).first()
    if existing:
        raise HTTPException(status_code=409, detail={
            "error": "PATIENT_CODE_EXISTS",
            "message": f"A patient with code '{code}' already exists."
        })
    patient = Patient(
        patient_code=code,
        name=patient_data.name,
        age=patient_data.age,
        gender=patient_data.gender
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return PatientResponse.model_validate(patient)


@router.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail={
            "error": "PATIENT_NOT_FOUND",
            "message": f"Patient with ID {patient_id} not found."
        })
    return PatientResponse.model_validate(patient)


@router.patch("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: int, patient_data: PatientUpdate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail={
            "error": "PATIENT_NOT_FOUND",
            "message": f"Patient with ID {patient_id} not found."
        })
    if patient_data.name is not None:
        patient.name = patient_data.name
    if patient_data.age is not None:
        patient.age = patient_data.age
    if patient_data.gender is not None:
        patient.gender = patient_data.gender
    db.commit()
    db.refresh(patient)
    return PatientResponse.model_validate(patient)


@router.get("/patients/{patient_id}/predictions")
async def get_patient_predictions(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail={
            "error": "PATIENT_NOT_FOUND",
            "message": f"Patient with ID {patient_id} not found."
        })

    predictions = db.query(Prediction).filter(
        Prediction.patient_id == patient_id
    ).order_by(Prediction.created_at.desc()).all()

    return {
        "patient_id": patient_id,
        "patient_code": patient.patient_code,
        "predictions": [
            {
                "id": p.id,
                "risk_level": p.risk_level,
                "risk_probability": p.risk_probability,
                "model_version": p.model_version,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in predictions
        ]
    }


@router.get("/patients/{patient_id}/trajectory")
async def get_patient_trajectory(patient_id: int, db: Session = Depends(get_db)):
    """
    Computes longitudinal trajectory and progression analytics across all patient visits.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    preds = db.query(Prediction).filter(
        Prediction.patient_id == patient_id
    ).order_by(Prediction.created_at.asc()).all()

    extractor = RetinalFeatureExtractor()
    points = []
    baseline_risk = None
    prev_risk = None

    for i, p in enumerate(preds, start=1):
        clinical = db.query(ClinicalRecord).filter(ClinicalRecord.id == p.clinical_record_id).first()
        retinal = db.query(RetinalImage).filter(RetinalImage.id == p.retinal_image_id).first()

        risk_pct = round(float(p.risk_probability) * 100, 1)

        # Biomarkers
        avr, density, tortuosity = 0.68, 11.5, 1.12
        if retinal and (UPLOAD_DIR / retinal.image_path).exists():
            bm = extractor.extract_features(str(UPLOAD_DIR / retinal.image_path))
            avr = bm.get("avr", 0.68)
            density = bm.get("vessel_density", 11.5)
            tortuosity = bm.get("vessel_tortuosity", 1.12)

        if baseline_risk is None:
            baseline_risk = risk_pct
            delta_base = 0.0
        else:
            delta_base = round(risk_pct - baseline_risk, 1)

        if prev_risk is None:
            delta_prev = 0.0
        else:
            delta_prev = round(risk_pct - prev_risk, 1)
        prev_risk = risk_pct

        date_str = p.created_at.strftime("%b %d, %Y") if p.created_at else f"Visit #{i}"

        points.append({
            "visit_index": i,
            "prediction_id": p.id,
            "date": date_str,
            "timestamp": p.created_at.isoformat() if p.created_at else None,
            "risk_percentage": risk_pct,
            "risk_level": p.risk_level,
            "systolic_bp": float(clinical.systolic_bp) if clinical else 120.0,
            "diastolic_bp": float(clinical.diastolic_bp) if clinical else 80.0,
            "cholesterol": float(clinical.cholesterol) if clinical else 200.0,
            "bmi": float(clinical.bmi) if clinical else 24.0,
            "avr": float(avr),
            "vessel_density": float(density),
            "vessel_tortuosity": float(tortuosity),
            "delta_baseline": delta_base,
            "delta_previous": delta_prev
        })

    # Summary metrics
    if points:
        current_pt = points[-1]
        baseline_pt = points[0]
        total_risk_change = round(current_pt["risk_percentage"] - baseline_pt["risk_percentage"], 1)

        if total_risk_change >= 5.0:
            velocity_status = "Accelerating Risk"
            velocity_color = "red"
        elif total_risk_change <= -3.0:
            velocity_status = "Improving / Responding to Therapy"
            velocity_color = "green"
        else:
            velocity_status = "Stable / Controlled"
            velocity_color = "emerald"

        bp_controlled = current_pt["systolic_bp"] < 130 and current_pt["diastolic_bp"] < 80
        bp_status = "Controlled (<130/80)" if bp_controlled else "Uncontrolled"

        microvasc_status = "Preserved Microvasculature" if current_pt["avr"] >= 0.67 else "Arteriolar Narrowing"
    else:
        current_pt = None
        baseline_pt = None
        total_risk_change = 0.0
        velocity_status = "No Baseline"
        velocity_color = "gray"
        bp_status = "Unknown"
        microvasc_status = "Unknown"

    return {
        "patient_id": patient_id,
        "patient_code": patient.patient_code,
        "patient_name": patient.name,
        "total_assessments": len(points),
        "trajectory": points,
        "kpis": {
            "baseline_risk": baseline_pt["risk_percentage"] if baseline_pt else 0.0,
            "current_risk": current_pt["risk_percentage"] if current_pt else 0.0,
            "total_risk_change": total_risk_change,
            "velocity_status": velocity_status,
            "velocity_color": velocity_color,
            "bp_status": bp_status,
            "microvascular_status": microvasc_status
        }
    }


@router.post("/patients/{patient_id}/simulate-visit")
async def simulate_follow_up_visit(
    patient_id: int,
    visit_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Creates a simulated or recorded follow-up visit for the patient to demonstrate
    longitudinal disease progression or therapeutic risk reduction.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # Get latest retinal image as baseline, or use demo fallback
    latest_img = db.query(RetinalImage).filter(RetinalImage.patient_id == patient_id).order_by(RetinalImage.id.desc()).first()
    if not latest_img:
        # Fallback to any uploaded image
        any_img = db.query(RetinalImage).first()
        if not any_img:
            raise HTTPException(status_code=400, detail="No baseline retinal images found in system.")
        image_to_use = any_img.image_path
        retinal_id = any_img.id
    else:
        image_to_use = latest_img.image_path
        retinal_id = latest_img.id

    img_full_path = str(UPLOAD_DIR / image_to_use)

    # 1. Create new Clinical Record
    clinical = ClinicalRecord(
        patient_id=patient.id,
        systolic_bp=float(visit_data.get("systolic_bp", 125.0)),
        diastolic_bp=float(visit_data.get("diastolic_bp", 82.0)),
        cholesterol=float(visit_data.get("cholesterol", 195.0)),
        bmi=float(visit_data.get("bmi", 24.5)),
        diabetes=bool(visit_data.get("diabetes", False)),
        smoking_status=str(visit_data.get("smoking_status", "never"))
    )
    db.add(clinical)
    db.commit()
    db.refresh(clinical)

    # 2. Run model prediction
    model = get_model_service()
    clinical_dict = {
        "age": patient.age,
        "gender": patient.gender,
        "systolic_bp": clinical.systolic_bp,
        "diastolic_bp": clinical.diastolic_bp,
        "cholesterol": clinical.cholesterol,
        "bmi": clinical.bmi,
        "diabetes": clinical.diabetes,
        "smoking_status": clinical.smoking_status
    }

    pred_res = model.predict(img_full_path, clinical_dict)

    # 3. Save Prediction
    prediction = Prediction(
        patient_id=patient.id,
        clinical_record_id=clinical.id,
        retinal_image_id=retinal_id,
        risk_probability=pred_res["risk_probability"],
        risk_level=pred_res["risk_level"],
        model_version=pred_res["model_version"],
        threshold=pred_res["threshold"],
        gradcam_path=None
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return {
        "status": "success",
        "message": f"Follow-up assessment #{prediction.id} logged successfully.",
        "prediction_id": prediction.id,
        "risk_probability": pred_res["risk_probability"],
        "risk_level": pred_res["risk_level"]
    }


@router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail={
            "error": "PATIENT_NOT_FOUND",
            "message": f"Patient with ID {patient_id} not found."
        })
    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted successfully"}
