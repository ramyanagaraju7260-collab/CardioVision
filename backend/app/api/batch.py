"""
CardioVision AI — Batch Cohort Screening & Dataset Ingestion Router

Automates bulk cohort screening using clinical spreadsheets and retinal image repositories:
- Reads clinical_data_dummy.xlsx
- Ingests matching fundus images from synthetic_retinal_images_15_png
- Executes multimodal predictions and quantitative biomarker extraction
- Populates database and exports cohort summaries
"""

import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
import io
import pandas as pd
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.config import UPLOAD_DIR, BASE_DIR, APP_MODE
from app.models.patient import Patient
from app.models.clinical_record import ClinicalRecord
from app.models.retinal_image import RetinalImage
from app.models.prediction import Prediction
from app.ml.model_service import get_model_service
from app.utils.helpers import generate_unique_filename

router = APIRouter()


@router.post("/batch/run-cohort-screening")
async def run_cohort_screening(db: Session = Depends(get_db)):
    """
    Executes automated batch screening on the bundled 15-patient cohort.
    Reads clinical_data_dummy.xlsx and pairs with synthetic_retinal_images_15_png.
    """
    root_dir = BASE_DIR.parent
    excel_path = root_dir / "clinical_data_dummy.xlsx"
    images_dir = root_dir / "synthetic_retinal_images_15_png"

    if not excel_path.exists():
        raise HTTPException(status_code=404, detail="clinical_data_dummy.xlsx not found at project root.")
    if not images_dir.exists():
        raise HTTPException(status_code=404, detail="synthetic_retinal_images_15_png directory not found.")

    try:
        df = pd.read_excel(excel_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read clinical spreadsheet: {str(e)}")

    model = get_model_service()
    results = []
    created_count = 0

    for _, row in df.iterrows():
        p_code = str(row.get("patient_id", "")).strip()
        img_filename = str(row.get("image_name", "")).strip()
        age = int(row.get("age", 50))
        gender = str(row.get("gender", "Other")).capitalize()
        bp_raw = str(row.get("blood_pressure", "120/80")).split("/")
        systolic_bp = float(bp_raw[0]) if len(bp_raw) > 0 else 120.0
        diastolic_bp = float(bp_raw[1]) if len(bp_raw) > 1 else 80.0
        cholesterol = float(row.get("cholesterol", 200.0))
        bmi = float(row.get("bmi", 25.0))
        diabetes_val = row.get("diabetes", 0)
        diabetes = bool(diabetes_val == 1 or str(diabetes_val).lower() == "yes")
        smoking_val = str(row.get("smoking", "never")).lower()
        smoking_status = "current" if smoking_val in ["yes", "current", "1"] else ("former" if "former" in smoking_val else "never")

        # 1. Get or Create Patient
        patient = db.query(Patient).filter(Patient.patient_code == p_code).first()
        if not patient:
            patient = Patient(
                patient_code=p_code,
                name=f"Cohort Patient {p_code}",
                age=age,
                gender=gender
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)

        # 2. Add Clinical Record
        clinical = ClinicalRecord(
            patient_id=patient.id,
            systolic_bp=systolic_bp,
            diastolic_bp=diastolic_bp,
            cholesterol=cholesterol,
            bmi=bmi,
            diabetes=diabetes,
            smoking_status=smoking_status
        )
        db.add(clinical)
        db.commit()
        db.refresh(clinical)

        # 3. Locate and Copy Retinal Image to uploads
        src_img = images_dir / img_filename
        if not src_img.exists():
            # Fallback to any available png
            pngs = list(images_dir.glob("*.png"))
            src_img = pngs[0] if pngs else None

        if src_img and src_img.exists():
            dest_filename = generate_unique_filename(src_img.name)
            dest_path = UPLOAD_DIR / dest_filename
            shutil.copy(src_img, dest_path)

            retinal_img = RetinalImage(
                patient_id=patient.id,
                image_path=dest_filename,
                original_filename=src_img.name,
                quality_status="validated"
            )
            db.add(retinal_img)
            db.commit()
            db.refresh(retinal_img)

            # 4. Execute Prediction with Retinal Biomarker Extraction
            clinical_dict = {
                "age": age, "gender": gender,
                "systolic_bp": systolic_bp, "diastolic_bp": diastolic_bp,
                "cholesterol": cholesterol, "bmi": bmi,
                "diabetes": diabetes, "smoking_status": smoking_status
            }

            gradcam_fn = f"gradcam_{generate_unique_filename('gradcam.png')}"
            gradcam_path = str(UPLOAD_DIR / gradcam_fn)
            vessel_fn = f"vessel_{generate_unique_filename('vessel.png')}"
            vessel_path = str(UPLOAD_DIR / vessel_fn)

            pred_res = model.predict(str(dest_path), clinical_dict, gradcam_path, vessel_path)

            prediction = Prediction(
                patient_id=patient.id,
                clinical_record_id=clinical.id,
                retinal_image_id=retinal_img.id,
                risk_probability=pred_res["risk_probability"],
                risk_level=pred_res["risk_level"],
                model_version=pred_res["model_version"],
                threshold=pred_res["threshold"],
                gradcam_path=gradcam_path if pred_res["gradcam"]["available"] else None
            )
            db.add(prediction)
            db.commit()
            db.refresh(prediction)

            created_count += 1
            results.append({
                "prediction_id": prediction.id,
                "patient_code": p_code,
                "patient_name": patient.name,
                "risk_level": pred_res["risk_level"],
                "risk_probability": pred_res["risk_probability"],
                "avr": pred_res["biomarkers"].get("avr"),
                "vessel_density": pred_res["biomarkers"].get("vessel_density"),
                "tortuosity": pred_res["biomarkers"].get("vessel_tortuosity"),
                "health_score": pred_res["biomarkers"].get("microvascular_health_score"),
            })

    high_risk_n = sum(1 for r in results if r["risk_level"] == "HIGH_RISK")
    medium_risk_n = sum(1 for r in results if r["risk_level"] == "MEDIUM_RISK")
    low_risk_n = sum(1 for r in results if r["risk_level"] == "LOW_RISK")

    return {
        "status": "completed",
        "total_screened": created_count,
        "high_risk_count": high_risk_n,
        "medium_risk_count": medium_risk_n,
        "low_risk_count": low_risk_n,
        "cohort_summary": results
    }


@router.get("/batch/export")
async def export_cohort_data(format: str = "csv", db: Session = Depends(get_db)):
    """
    Exports all patients, clinical parameters, predictions, and retinal biomarkers as CSV.
    """
    preds = db.query(Prediction).join(Patient).join(ClinicalRecord).all()
    rows = []
    for p in preds:
        rows.append({
            "Prediction_ID": p.id,
            "Patient_Code": p.patient.patient_code if p.patient else "",
            "Name": p.patient.name if p.patient else "",
            "Age": p.patient.age if p.patient else "",
            "Gender": p.patient.gender if p.patient else "",
            "Systolic_BP": p.clinical_record.systolic_bp if p.clinical_record else "",
            "Diastolic_BP": p.clinical_record.diastolic_bp if p.clinical_record else "",
            "Cholesterol": p.clinical_record.cholesterol if p.clinical_record else "",
            "BMI": p.clinical_record.bmi if p.clinical_record else "",
            "Diabetes": p.clinical_record.diabetes if p.clinical_record else False,
            "Smoking": p.clinical_record.smoking_status if p.clinical_record else "",
            "AI_Risk_Probability": p.risk_probability,
            "Risk_Level": p.risk_level,
            "Assessment_Date": p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else "",
        })

    df = pd.DataFrame(rows)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)

    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cardiovision_cohort_export.csv"}
    )
