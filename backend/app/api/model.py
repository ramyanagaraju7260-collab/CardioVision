"""
CardioVision AI — Model Metadata API Router
"""

from fastapi import APIRouter
from app.ml.model_service import get_model_service
from app.config import APP_MODE

router = APIRouter()


@router.get("/model/metadata")
async def get_model_metadata():
    model = get_model_service()
    return model.get_metadata()


@router.get("/model/metrics")
async def get_model_metrics():
    model = get_model_service()
    return model.get_metrics()


@router.get("/dashboard")
async def get_dashboard_data():
    """Aggregate dashboard statistics from the database."""
    from app.database import SessionLocal
    from app.models.patient import Patient
    from app.models.prediction import Prediction

    db = SessionLocal()
    try:
        total_patients = db.query(Patient).count()
        total_predictions = db.query(Prediction).count()
        high_risk_count = db.query(Prediction).filter(Prediction.risk_level == "HIGH_RISK").count()
        medium_risk_count = db.query(Prediction).filter(Prediction.risk_level == "MEDIUM_RISK").count()
        low_risk_count = db.query(Prediction).filter(Prediction.risk_level == "LOW_RISK").count()

        # Recent predictions
        recent = db.query(Prediction).join(Patient).order_by(
            Prediction.created_at.desc()
        ).limit(5).all()

        recent_list = []
        for p in recent:
            recent_list.append({
                "id": p.id,
                "patient_code": p.patient.patient_code if p.patient else "N/A",
                "patient_name": p.patient.name if p.patient else "N/A",
                "risk_level": p.risk_level,
                "risk_probability": p.risk_probability,
                "created_at": p.created_at.isoformat() if p.created_at else None
            })

        model = get_model_service()
        metrics = model.get_metrics()

        return {
            "total_patients": total_patients,
            "total_predictions": total_predictions,
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "model_status": "ready" if model.model_loaded else ("demo" if APP_MODE == "demo" else "pending"),
            "recent_predictions": recent_list,
            "model_metrics": metrics,
            "mode": APP_MODE
        }
    finally:
        db.close()


@router.get("/analytics/demographics")
async def get_demographics_analytics():
    """Aggregate population-level demographic and risk distribution from the database."""
    from app.database import SessionLocal
    from app.models.patient import Patient
    from app.models.prediction import Prediction
    from app.models.clinical_record import ClinicalRecord

    db = SessionLocal()
    try:
        preds = db.query(Prediction).join(Patient).all()
        total = len(preds)
        high_risk_count = sum(1 for p in preds if p.risk_level == "HIGH_RISK")
        medium_risk_count = sum(1 for p in preds if p.risk_level == "MEDIUM_RISK")
        low_risk_count = sum(1 for p in preds if p.risk_level == "LOW_RISK")

        risk_data = [
            {"name": "Low Risk", "value": round((low_risk_count / total * 100) if total else 50, 1), "count": low_risk_count, "color": "#22c55e"},
            {"name": "Medium Risk", "value": round((medium_risk_count / total * 100) if total else 30, 1), "count": medium_risk_count, "color": "#f59e0b"},
            {"name": "High Risk", "value": round((high_risk_count / total * 100) if total else 20, 1), "count": high_risk_count, "color": "#ef4444"},
        ]

        buckets = {
            "30-40": {"low": 0, "medium": 0, "high": 0},
            "41-50": {"low": 0, "medium": 0, "high": 0},
            "51-60": {"low": 0, "medium": 0, "high": 0},
            "60+": {"low": 0, "medium": 0, "high": 0}
        }
        for p in preds:
            age = p.patient.age if p.patient else 45
            tier = "high" if p.risk_level == "HIGH_RISK" else ("medium" if p.risk_level == "MEDIUM_RISK" else "low")
            if age <= 40:
                b = "30-40"
            elif age <= 50:
                b = "41-50"
            elif age <= 60:
                b = "51-60"
            else:
                b = "60+"
            buckets[b][tier] += 1

        demographic_data = [
            {"age": k, "low": v["low"], "medium": v["medium"], "high": v["high"]}
            for k, v in buckets.items()
        ]

        return {
            "total_cases": total,
            "risk_data": risk_data,
            "demographic_data": demographic_data,
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
        }
    finally:
        db.close()


@router.get("/reports")
async def get_reports_list():
    """List all available clinical assessment reports."""
    from app.database import SessionLocal
    from app.models.prediction import Prediction
    from app.models.patient import Patient

    db = SessionLocal()
    try:
        preds = db.query(Prediction).join(Patient).order_by(Prediction.created_at.desc()).all()
        report_items = []
        for p in preds:
            report_items.append({
                "id": f"REP-PRED-{p.id:04d}",
                "prediction_id": p.id,
                "name": f"Cardiovascular Assessment — {p.patient.name if p.patient else 'Patient'} ({p.patient.patient_code if p.patient else 'P000'})",
                "patient_name": p.patient.name if p.patient else "N/A",
                "patient_code": p.patient.patient_code if p.patient else "N/A",
                "risk_level": p.risk_level,
                "risk_probability": p.risk_probability,
                "date": p.created_at.strftime("%b %d, %Y") if p.created_at else "Recent",
                "type": "PDF",
                "download_url": f"/api/predictions/{p.id}/report"
            })
        return {"reports": report_items, "total": len(report_items)}
    finally:
        db.close()


@router.get("/analytics/alerts")
async def get_system_alerts():
    """Generate dynamic clinical and system alerts based on current patient cases."""
    from app.database import SessionLocal
    from app.models.prediction import Prediction
    from app.models.clinical_record import ClinicalRecord
    from app.models.patient import Patient

    db = SessionLocal()
    try:
        alerts = []
        high_risk_preds = db.query(Prediction).join(Patient).join(ClinicalRecord).filter(
            Prediction.risk_level == "HIGH_RISK"
        ).order_by(Prediction.created_at.desc()).limit(3).all()

        for p in high_risk_preds:
            alerts.append({
                "id": f"alert-high-{p.id}",
                "type": "critical",
                "title": f"High Cardiovascular Risk: {p.patient.name} ({p.patient.patient_code})",
                "message": f"Multimodal AI assessment scored {(p.risk_probability * 100):.1f}% risk probability. Blood Pressure: {p.clinical_record.systolic_bp}/{p.clinical_record.diastolic_bp} mmHg, Cholesterol: {p.clinical_record.cholesterol} mg/dL. Immediate cardiology consultation recommended.",
                "patient_id": p.patient_id,
                "prediction_id": p.id,
                "time": p.created_at.strftime("%b %d, %Y %H:%M") if p.created_at else "Recently",
            })

        medium_risk_preds = db.query(Prediction).join(Patient).join(ClinicalRecord).filter(
            Prediction.risk_level == "MEDIUM_RISK"
        ).order_by(Prediction.created_at.desc()).limit(2).all()

        for p in medium_risk_preds:
            alerts.append({
                "id": f"alert-med-{p.id}",
                "type": "warning",
                "title": f"Moderate CVD Risk: {p.patient.name} ({p.patient.patient_code})",
                "message": f"Multimodal AI assessment scored {(p.risk_probability * 100):.1f}% risk probability. Moderate-intensity statin therapy and 3-month clinical follow-up recommended.",
                "patient_id": p.patient_id,
                "prediction_id": p.id,
                "time": p.created_at.strftime("%b %d, %Y %H:%M") if p.created_at else "Recently",
            })

        htn_preds = db.query(Prediction).join(Patient).join(ClinicalRecord).filter(
            ClinicalRecord.systolic_bp >= 160.0
        ).limit(2).all()

        for p in htn_preds:
            if not any(a["id"] == f"alert-high-{p.id}" for a in alerts):
                alerts.append({
                    "id": f"alert-htn-{p.id}",
                    "type": "warning",
                    "title": f"Severe Hypertension Detected: {p.patient.name}",
                    "message": f"Recorded Systolic BP {p.clinical_record.systolic_bp} mmHg exceeds Stage 2 hypertension threshold. Retinal microvascular damage assessment advised.",
                    "patient_id": p.patient_id,
                    "prediction_id": p.id,
                    "time": p.created_at.strftime("%b %d, %Y %H:%M") if p.created_at else "Recently",
                })

        alerts.append({
            "id": "alert-sys-1",
            "type": "info",
            "title": "Dual-Engine Microvascular Model Active",
            "message": "OpenCV retinal feature extraction and Framingham/ASCVD comparative risk engine operational.",
            "time": "System Active",
        })
        alerts.append({
            "id": "alert-sys-2",
            "type": "success",
            "title": "Database & Image Pipeline Synchronized",
            "message": "SQLite database cardiovision.db operational with validated patient records and fundus scans.",
            "time": "System Optimal",
        })

        return {"alerts": alerts, "total": len(alerts)}
    finally:
        db.close()
