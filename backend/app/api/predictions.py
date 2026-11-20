"""
CardioVision AI — Predictions API Router
"""

from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.config import UPLOAD_DIR, REPORTS_DIR, APP_MODE
from app.models.patient import Patient
from app.models.clinical_record import ClinicalRecord
from app.models.retinal_image import RetinalImage
from app.models.prediction import Prediction
from app.models.report import Report
from app.schemas.prediction import (
    PredictionRequest, PredictionResponse, PredictionListResponse,
    PredictionListItem, ProbabilityBreakdown, ModelInfo, ExplainabilityInfo,
)
from app.ml.model_service import get_model_service
from app.ml.traditional_risk import calculate_framingham_risk, calculate_ascvd_risk, analyze_risk_discordance
from app.ml.cdss import generate_cdss_recommendations
from app.services.report_service import generate_prediction_report
from app.utils.helpers import generate_unique_filename

router = APIRouter()


@router.post("/predictions", status_code=201)
async def create_prediction(data: PredictionRequest, db: Session = Depends(get_db)):
    # Validate all referenced records exist
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail={
            "error": "PATIENT_NOT_FOUND",
            "message": f"Patient {data.patient_id} not found."
        })

    clinical = db.query(ClinicalRecord).filter(ClinicalRecord.id == data.clinical_record_id).first()
    if not clinical:
        raise HTTPException(status_code=404, detail={
            "error": "CLINICAL_RECORD_NOT_FOUND",
            "message": f"Clinical record {data.clinical_record_id} not found."
        })

    retinal = db.query(RetinalImage).filter(RetinalImage.id == data.retinal_image_id).first()
    if not retinal:
        raise HTTPException(status_code=404, detail={
            "error": "RETINAL_IMAGE_NOT_FOUND",
            "message": f"Retinal image {data.retinal_image_id} not found."
        })

    # Build clinical data dict for model
    clinical_data = {
        "age": patient.age,
        "gender": patient.gender,
        "systolic_bp": clinical.systolic_bp,
        "diastolic_bp": clinical.diastolic_bp,
        "cholesterol": clinical.cholesterol,
        "bmi": clinical.bmi,
        "diabetes": clinical.diabetes,
        "smoking_status": clinical.smoking_status,
    }

    # Resolve image path
    image_path = retinal.image_path
    if not Path(image_path).is_absolute():
        image_path = str(UPLOAD_DIR / image_path)

    # Grad-CAM and Vessel Mask save paths
    gradcam_filename = f"gradcam_{generate_unique_filename('gradcam.png')}"
    gradcam_save_path = str(UPLOAD_DIR / gradcam_filename)
    vessel_mask_filename = f"vessel_{generate_unique_filename('vessel_mask.png')}"
    vessel_mask_save_path = str(UPLOAD_DIR / vessel_mask_filename)

    # Run prediction
    model = get_model_service()
    try:
        result = model.predict(image_path, clinical_data, gradcam_save_path, vessel_mask_save_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail={
            "error": "INVALID_RETINAL_IMAGE",
            "message": str(e)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "error": "PREDICTION_FAILED",
            "message": f"Model inference failed: {str(e)}"
        })

    # Save prediction
    gradcam_path = result["gradcam"].get("path") if result["gradcam"]["available"] else None
    prediction = Prediction(
        patient_id=data.patient_id,
        clinical_record_id=data.clinical_record_id,
        retinal_image_id=data.retinal_image_id,
        risk_probability=result["risk_probability"],
        risk_level=result["risk_level"],
        model_version=result["model_version"],
        threshold=result["threshold"],
        gradcam_path=gradcam_path,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    # Build response
    gradcam_url = f"/api/images/{Path(gradcam_path).name}" if gradcam_path else None
    vessel_mask_url = f"/api/images/{vessel_mask_filename}" if Path(vessel_mask_save_path).exists() else None
    biomarkers = result.get("biomarkers") or {}
    if biomarkers:
        biomarkers["vessel_mask_url"] = vessel_mask_url

    # Traditional clinical risk score comparison
    framingham = calculate_framingham_risk(
        age=patient.age,
        gender=patient.gender,
        systolic_bp=clinical.systolic_bp,
        cholesterol=clinical.cholesterol,
        smoking=clinical.smoking_status,
        diabetes=clinical.diabetes
    )
    ascvd = calculate_ascvd_risk(
        age=patient.age,
        gender=patient.gender,
        systolic_bp=clinical.systolic_bp,
        cholesterol=clinical.cholesterol,
        smoking=clinical.smoking_status,
        diabetes=clinical.diabetes
    )
    discordance = analyze_risk_discordance(
        result["risk_probability"],
        framingham["risk_percentage"],
        biomarkers
    )
    traditional_risk = {
        "framingham": framingham,
        "ascvd": ascvd,
        "discordance": discordance
    }

    # Clinical Decision Support System (CDSS)
    cdss = generate_cdss_recommendations(
        risk_probability=result["risk_probability"],
        risk_level=result["risk_level"],
        clinical_data={**clinical_data, "patient_name": patient.name},
        biomarkers=biomarkers,
        traditional_risk=traditional_risk
    )

    return {
        "id": prediction.id,
        "patient_id": patient.id,
        "patient_code": patient.patient_code,
        "patient_name": patient.name,
        "risk_level": result["risk_level"],
        "risk_probability": result["risk_probability"],
        "probabilities": result["probabilities"],
        "model": {
            "name": model.metadata.get("model_name", "CardioVision-Multimodal-Ensemble"),
            "version": result["model_version"],
            "threshold": result["threshold"],
            "type": result.get("model_type", "Calibrated Multimodal Ensemble")
        },
        "explainability": {
            "gradcam_available": result["gradcam"]["available"],
            "gradcam_url": gradcam_url,
            "vessel_mask_url": vessel_mask_url,
        },
        "biomarkers": biomarkers,
        "traditional_risk": traditional_risk,
        "cdss": cdss,
        "feature_contributions": result.get("feature_contributions", []),
        "mode": result["mode"],
        "clinical_data": clinical_data,
        "retinal_image_url": f"/api/images/{Path(retinal.image_path).name}",
        "created_at": prediction.created_at.isoformat() if prediction.created_at else None
    }


@router.get("/predictions/{prediction_id}/cdss")
async def get_prediction_cdss(prediction_id: int, db: Session = Depends(get_db)):
    """Returns Clinical Decision Support System recommendations for a prediction."""
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    patient = db.query(Patient).filter(Patient.id == prediction.patient_id).first()
    clinical = db.query(ClinicalRecord).filter(ClinicalRecord.id == prediction.clinical_record_id).first()
    retinal = db.query(RetinalImage).filter(RetinalImage.id == prediction.retinal_image_id).first()

    clinical_data = {
        "age": patient.age,
        "gender": patient.gender,
        "systolic_bp": clinical.systolic_bp,
        "diastolic_bp": clinical.diastolic_bp,
        "cholesterol": clinical.cholesterol,
        "bmi": clinical.bmi,
        "diabetes": clinical.diabetes,
        "smoking_status": clinical.smoking_status,
        "patient_name": patient.name
    }

    model = get_model_service()
    biomarkers = model.retinal_features.extract_features(str(UPLOAD_DIR / retinal.image_path)) if retinal else {}

    framingham = calculate_framingham_risk(
        age=patient.age, gender=patient.gender, systolic_bp=clinical.systolic_bp,
        cholesterol=clinical.cholesterol, smoking=clinical.smoking_status, diabetes=clinical.diabetes
    )
    ascvd = calculate_ascvd_risk(
        age=patient.age, gender=patient.gender, systolic_bp=clinical.systolic_bp,
        cholesterol=clinical.cholesterol, smoking=clinical.smoking_status, diabetes=clinical.diabetes
    )
    discordance = analyze_risk_discordance(prediction.risk_probability, framingham["risk_percentage"], biomarkers)
    traditional_risk = {"framingham": framingham, "ascvd": ascvd, "discordance": discordance}

    return generate_cdss_recommendations(
        risk_probability=prediction.risk_probability,
        risk_level=prediction.risk_level,
        clinical_data=clinical_data,
        biomarkers=biomarkers,
        traditional_risk=traditional_risk
    )



@router.get("/predictions")
async def list_predictions(
    search: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Prediction).join(Patient)

    if search:
        query = query.filter(
            (Patient.name.ilike(f"%{search}%")) |
            (Patient.patient_code.ilike(f"%{search}%"))
        )
    if risk_level:
        query = query.filter(Prediction.risk_level == risk_level)

    total = query.count()
    predictions = query.order_by(Prediction.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for p in predictions:
        items.append({
            "id": p.id,
            "patient_id": p.patient_id,
            "patient_code": p.patient.patient_code if p.patient else "N/A",
            "patient_name": p.patient.name if p.patient else "N/A",
            "risk_level": p.risk_level,
            "risk_probability": p.risk_probability,
            "model_version": p.model_version,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })

    return {"predictions": items, "total": total}


@router.get("/predictions/{prediction_id}")
async def get_prediction(prediction_id: int, db: Session = Depends(get_db)):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail={
            "error": "PREDICTION_NOT_FOUND",
            "message": f"Prediction {prediction_id} not found."
        })

    patient = prediction.patient
    clinical = prediction.clinical_record
    retinal = prediction.retinal_image
    model = get_model_service()

    clinical_data = {}
    if clinical:
        clinical_data = {
            "age": patient.age if patient else None,
            "gender": patient.gender if patient else None,
            "systolic_bp": clinical.systolic_bp,
            "diastolic_bp": clinical.diastolic_bp,
            "cholesterol": clinical.cholesterol,
            "bmi": clinical.bmi,
            "diabetes": clinical.diabetes,
            "smoking_status": clinical.smoking_status,
        }

    gradcam_url = None
    gradcam_available = False
    if prediction.gradcam_path and Path(prediction.gradcam_path).exists():
        gradcam_url = f"/api/images/{Path(prediction.gradcam_path).name}"
        gradcam_available = True

    retinal_image_url = None
    biomarkers = None
    if retinal and retinal.image_path:
        retinal_image_url = f"/api/images/{Path(retinal.image_path).name}"
        ip = retinal.image_path
        if not Path(ip).is_absolute():
            ip = str(UPLOAD_DIR / ip)
        if Path(ip).exists():
            biomarkers = model.retinal_features.extract_features(ip)

    traditional_risk = None
    if patient and clinical:
        framingham = calculate_framingham_risk(
            age=patient.age,
            gender=patient.gender,
            systolic_bp=clinical.systolic_bp,
            cholesterol=clinical.cholesterol,
            smoking=clinical.smoking_status,
            diabetes=clinical.diabetes
        )
        ascvd = calculate_ascvd_risk(
            age=patient.age,
            gender=patient.gender,
            systolic_bp=clinical.systolic_bp,
            cholesterol=clinical.cholesterol,
            smoking=clinical.smoking_status,
            diabetes=clinical.diabetes
        )
        discordance = analyze_risk_discordance(
            prediction.risk_probability,
            framingham["risk_percentage"],
            biomarkers or {}
        )
        traditional_risk = {
            "framingham": framingham,
            "ascvd": ascvd,
            "discordance": discordance
        }

    return {
        "id": prediction.id,
        "patient_id": patient.id if patient else None,
        "patient_code": patient.patient_code if patient else "N/A",
        "patient_name": patient.name if patient else "N/A",
        "risk_level": prediction.risk_level,
        "risk_probability": prediction.risk_probability,
        "probabilities": {
            "low_risk": round(1.0 - prediction.risk_probability, 4),
            "high_risk": round(prediction.risk_probability, 4)
        },
        "model": {
            "name": model.metadata.get("model_name", "CardioVision-Multimodal"),
            "version": prediction.model_version,
            "threshold": prediction.threshold
        },
        "explainability": {
            "gradcam_available": gradcam_available,
            "gradcam_url": gradcam_url
        },
        "biomarkers": biomarkers,
        "traditional_risk": traditional_risk,
        "mode": APP_MODE,
        "clinical_data": clinical_data,
        "retinal_image_url": retinal_image_url,
        "created_at": prediction.created_at.isoformat() if prediction.created_at else None
    }


@router.get("/predictions/{prediction_id}/report")
async def get_prediction_report(prediction_id: int, db: Session = Depends(get_db)):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail={
            "error": "PREDICTION_NOT_FOUND",
            "message": f"Prediction {prediction_id} not found."
        })

    # Check if report already exists
    report = db.query(Report).filter(Report.prediction_id == prediction_id).first()
    if report and Path(report.report_path).exists():
        return FileResponse(
            report.report_path,
            media_type="application/pdf",
            filename=f"cardiovision_report_{prediction_id}.pdf"
        )

    # Generate report
    patient = prediction.patient
    clinical = prediction.clinical_record
    retinal = prediction.retinal_image
    model = get_model_service()

    patient_data = {
        "patient_code": patient.patient_code if patient else "N/A",
        "name": patient.name if patient else "N/A",
        "age": patient.age if patient else "N/A",
        "gender": patient.gender if patient else "N/A",
    }

    clinical_data = {}
    if clinical:
        clinical_data = {
            "systolic_bp": clinical.systolic_bp,
            "diastolic_bp": clinical.diastolic_bp,
            "cholesterol": clinical.cholesterol,
            "bmi": clinical.bmi,
            "diabetes": clinical.diabetes,
            "smoking_status": clinical.smoking_status,
        }

    image_path = ""
    if retinal and retinal.image_path:
        ip = retinal.image_path
        if not Path(ip).is_absolute():
            ip = str(UPLOAD_DIR / ip)
        if Path(ip).exists():
            image_path = ip

    prediction_data = {
        "id": prediction.id,
        "risk_level": prediction.risk_level,
        "risk_probability": prediction.risk_probability,
        "model_version": prediction.model_version,
        "threshold": prediction.threshold,
        "mode": APP_MODE,
    }

    report_filename = f"report_{prediction_id}_{generate_unique_filename('report.pdf')}"
    report_path = str(REPORTS_DIR / report_filename)

    biomarkers = None
    if image_path and Path(image_path).exists():
        biomarkers = model.retinal_features.extract_features(image_path)

    traditional_risk = None
    if patient and clinical:
        framingham = calculate_framingham_risk(
            age=patient.age,
            gender=patient.gender,
            systolic_bp=clinical.systolic_bp,
            cholesterol=clinical.cholesterol,
            smoking=clinical.smoking_status,
            diabetes=clinical.diabetes
        )
        ascvd = calculate_ascvd_risk(
            age=patient.age,
            gender=patient.gender,
            systolic_bp=clinical.systolic_bp,
            cholesterol=clinical.cholesterol,
            smoking=clinical.smoking_status,
            diabetes=clinical.diabetes
        )
        discordance = analyze_risk_discordance(
            prediction.risk_probability,
            framingham["risk_percentage"],
            biomarkers or {}
        )
        traditional_risk = {
            "framingham": framingham,
            "ascvd": ascvd,
            "discordance": discordance
        }

    cdss = generate_cdss_recommendations(
        risk_probability=prediction.risk_probability,
        risk_level=prediction.risk_level,
        clinical_data={**clinical_data, "patient_name": patient.name},
        biomarkers=biomarkers or {},
        traditional_risk=traditional_risk
    )

    try:
        generate_prediction_report(
            prediction_data=prediction_data,
            patient_data=patient_data,
            clinical_data=clinical_data,
            image_path=image_path,
            output_path=report_path,
            model_metrics=model.get_metrics(),
            biomarkers=biomarkers,
            traditional_risk=traditional_risk,
            heatmap_path=prediction.gradcam_path,
            cdss=cdss,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "error": "REPORT_GENERATION_FAILED",
            "message": f"Failed to generate report: {str(e)}"
        })

    # Save report record
    report_record = Report(prediction_id=prediction_id, report_path=report_path)
    db.add(report_record)
    db.commit()

    return FileResponse(
        report_path,
        media_type="application/pdf",
        filename=f"cardiovision_report_{prediction_id}.pdf"
    )

@router.delete("/predictions/{prediction_id}")
async def delete_prediction(prediction_id: int, db: Session = Depends(get_db)):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail={
            "error": "PREDICTION_NOT_FOUND",
            "message": f"Prediction {prediction_id} not found."
        })
    db.delete(prediction)
    db.commit()
    return {"message": "Prediction deleted successfully"}
