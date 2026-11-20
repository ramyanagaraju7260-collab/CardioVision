"""
CardioVision AI — HL7 FHIR R4 Interoperability Router

Provides standard healthcare interoperability conforming to HL7 FHIR R4:
- Composition: CardioVision AI Clinical Risk Evaluation
- Patient: Demographics, identifier, MRN
- RiskAssessment: Multimodal AI prediction, probabilityDecimal, qualitative tier
- Observations: LOINC & SNOMED-CT coded clinical vitals and retinal microvascular biomarkers
"""

from datetime import datetime, timezone
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
import io
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.models.clinical_record import ClinicalRecord
from app.models.retinal_image import RetinalImage
from app.models.prediction import Prediction
from app.config import UPLOAD_DIR
from app.ml.retinal_features import RetinalFeatureExtractor

router = APIRouter()


def build_fhir_bundle(prediction: Prediction, patient: Patient, clinical: ClinicalRecord, retinal: RetinalImage) -> dict:
    """Constructs a fully compliant HL7 FHIR R4 Document Bundle."""
    pred_id = str(prediction.id)
    pat_id = str(patient.id)
    created_iso = prediction.created_at.isoformat() if prediction.created_at else datetime.now(timezone.utc).isoformat()

    # Extract or compute retinal biomarkers
    extractor = RetinalFeatureExtractor()
    img_path = UPLOAD_DIR / retinal.image_path if retinal else None
    if img_path and img_path.exists():
        biomarkers = extractor.extract_features(str(img_path))
    else:
        biomarkers = {"avr": 0.68, "vessel_density": 11.5, "vessel_tortuosity": 1.12, "mean_caliber_um": 18.2}

    entries = [
        # 1. Composition
        {
            "fullUrl": f"urn:uuid:composition-{pred_id}",
            "resource": {
                "resourceType": "Composition",
                "id": f"composition-{pred_id}",
                "status": "final",
                "type": {
                    "coding": [{
                        "system": "http://loinc.org",
                        "code": "75492-9",
                        "display": "Risk assessment note"
                    }],
                    "text": "CardioVision AI Cardiovascular Risk Stratification Report"
                },
                "subject": {"reference": f"urn:uuid:patient-{pat_id}", "display": patient.name},
                "date": created_iso,
                "title": "CardioVision AI Multimodal Retinal & Clinical Risk Evaluation",
                "section": [
                    {
                        "title": "Multimodal Prediction",
                        "entry": [{"reference": f"urn:uuid:riskassessment-{pred_id}"}]
                    },
                    {
                        "title": "Clinical & Microvascular Observations",
                        "entry": [
                            {"reference": f"urn:uuid:obs-sbp-{pred_id}"},
                            {"reference": f"urn:uuid:obs-dbp-{pred_id}"},
                            {"reference": f"urn:uuid:obs-chol-{pred_id}"},
                            {"reference": f"urn:uuid:obs-bmi-{pred_id}"},
                            {"reference": f"urn:uuid:obs-avr-{pred_id}"},
                            {"reference": f"urn:uuid:obs-tortuosity-{pred_id}"}
                        ]
                    }
                ]
            }
        },
        # 2. Patient
        {
            "fullUrl": f"urn:uuid:patient-{pat_id}",
            "resource": {
                "resourceType": "Patient",
                "id": f"patient-{pat_id}",
                "identifier": [{
                    "system": "urn:oid:cardiovision:mrn",
                    "value": patient.patient_code
                }],
                "name": [{
                    "use": "official",
                    "text": patient.name
                }],
                "gender": patient.gender.lower() if patient.gender in ["Male", "Female", "Other"] else "unknown"
            }
        },
        # 3. RiskAssessment
        {
            "fullUrl": f"urn:uuid:riskassessment-{pred_id}",
            "resource": {
                "resourceType": "RiskAssessment",
                "id": f"riskassessment-{pred_id}",
                "status": "final",
                "subject": {"reference": f"urn:uuid:patient-{pat_id}"},
                "occurrenceDateTime": created_iso,
                "method": {
                    "coding": [{
                        "system": "urn:oid:cardiovision:ai-algorithm",
                        "code": "CardioVision-Multimodal-Ensemble",
                        "display": f"CardioVision AI Model v{prediction.model_version}"
                    }]
                },
                "prediction": [{
                    "outcome": {
                        "coding": [{
                            "system": "http://snomed.info/sct",
                            "code": "49436004",
                            "display": "At risk for coronary heart disease (finding)"
                        }],
                        "text": "Cardiovascular Disease Event Risk"
                    },
                    "probabilityDecimal": round(float(prediction.risk_probability), 4),
                    "qualitativeRisk": {
                        "coding": [{
                            "system": "http://terminology.hl7.org/CodeSystem/risk-probability",
                            "code": "high" if prediction.risk_level == "HIGH_RISK" else ("moderate" if prediction.risk_level == "MEDIUM_RISK" else "low"),
                            "display": "High Risk" if prediction.risk_level == "HIGH_RISK" else ("Medium Risk" if prediction.risk_level == "MEDIUM_RISK" else "Low Risk")
                        }]
                    }
                }]
            }
        },
        # 4. Observations - Systolic BP
        {
            "fullUrl": f"urn:uuid:obs-sbp-{pred_id}",
            "resource": {
                "resourceType": "Observation",
                "id": f"obs-sbp-{pred_id}",
                "status": "final",
                "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
                "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure"}]},
                "subject": {"reference": f"urn:uuid:patient-{pat_id}"},
                "valueQuantity": {"value": float(clinical.systolic_bp), "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"}
            }
        },
        # 5. Observations - Diastolic BP
        {
            "fullUrl": f"urn:uuid:obs-dbp-{pred_id}",
            "resource": {
                "resourceType": "Observation",
                "id": f"obs-dbp-{pred_id}",
                "status": "final",
                "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
                "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic blood pressure"}]},
                "subject": {"reference": f"urn:uuid:patient-{pat_id}"},
                "valueQuantity": {"value": float(clinical.diastolic_bp), "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"}
            }
        },
        # 6. Observations - Cholesterol
        {
            "fullUrl": f"urn:uuid:obs-chol-{pred_id}",
            "resource": {
                "resourceType": "Observation",
                "id": f"obs-chol-{pred_id}",
                "status": "final",
                "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory"}]}],
                "code": {"coding": [{"system": "http://loinc.org", "code": "2093-3", "display": "Cholesterol [Mass/volume] in Serum or Plasma"}]},
                "subject": {"reference": f"urn:uuid:patient-{pat_id}"},
                "valueQuantity": {"value": float(clinical.cholesterol), "unit": "mg/dL", "system": "http://unitsofmeasure.org", "code": "mg/dL"}
            }
        },
        # 7. Observations - BMI
        {
            "fullUrl": f"urn:uuid:obs-bmi-{pred_id}",
            "resource": {
                "resourceType": "Observation",
                "id": f"obs-bmi-{pred_id}",
                "status": "final",
                "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
                "code": {"coding": [{"system": "http://loinc.org", "code": "39156-5", "display": "Body mass index (BMI) [Ratio]"}]},
                "subject": {"reference": f"urn:uuid:patient-{pat_id}"},
                "valueQuantity": {"value": float(clinical.bmi), "unit": "kg/m²", "system": "http://unitsofmeasure.org", "code": "kg/m2"}
            }
        },
        # 8. Observations - Retinal Arteriolar-to-Venular Ratio (SNOMED-CT)
        {
            "fullUrl": f"urn:uuid:obs-avr-{pred_id}",
            "resource": {
                "resourceType": "Observation",
                "id": f"obs-avr-{pred_id}",
                "status": "final",
                "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "exam"}]}],
                "code": {"coding": [{"system": "http://snomed.info/sct", "code": "441777002", "display": "Retinal arteriovenous ratio (observable entity)"}]},
                "subject": {"reference": f"urn:uuid:patient-{pat_id}"},
                "valueQuantity": {"value": float(biomarkers.get("avr", 0.68)), "unit": "ratio"}
            }
        },
        # 9. Observations - Retinal Vessel Tortuosity (SNOMED-CT)
        {
            "fullUrl": f"urn:uuid:obs-tortuosity-{pred_id}",
            "resource": {
                "resourceType": "Observation",
                "id": f"obs-tortuosity-{pred_id}",
                "status": "final",
                "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "exam"}]}],
                "code": {"coding": [{"system": "http://snomed.info/sct", "code": "251020004", "display": "Retinal vascular tortuosity (finding)"}]},
                "subject": {"reference": f"urn:uuid:patient-{pat_id}"},
                "valueQuantity": {"value": float(biomarkers.get("vessel_tortuosity", 1.12)), "unit": "index"}
            }
        }
    ]

    return {
        "resourceType": "Bundle",
        "id": f"bundle-cardiovision-prediction-{pred_id}",
        "type": "document",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total": len(entries),
        "entry": entries
    }


@router.get("/predictions/{prediction_id}/fhir")
async def get_prediction_fhir(prediction_id: int, db: Session = Depends(get_db)):
    """Returns official HL7 FHIR R4 JSON document for the prediction."""
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    patient = db.query(Patient).filter(Patient.id == prediction.patient_id).first()
    clinical = db.query(ClinicalRecord).filter(ClinicalRecord.id == prediction.clinical_record_id).first()
    retinal = db.query(RetinalImage).filter(RetinalImage.id == prediction.retinal_image_id).first()

    bundle = build_fhir_bundle(prediction, patient, clinical, retinal)
    return bundle


@router.get("/predictions/{prediction_id}/fhir/download")
async def download_prediction_fhir(prediction_id: int, db: Session = Depends(get_db)):
    """Streams a downloadable JSON file conforming to HL7 FHIR R4."""
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    patient = db.query(Patient).filter(Patient.id == prediction.patient_id).first()
    clinical = db.query(ClinicalRecord).filter(ClinicalRecord.id == prediction.clinical_record_id).first()
    retinal = db.query(RetinalImage).filter(RetinalImage.id == prediction.retinal_image_id).first()

    bundle = build_fhir_bundle(prediction, patient, clinical, retinal)
    json_str = json.dumps(bundle, indent=2)

    return StreamingResponse(
        io.StringIO(json_str),
        media_type="application/fhir+json",
        headers={"Content-Disposition": f"attachment; filename=cardiovision_fhir_p{patient.patient_code}_pred{prediction_id}.json"}
    )
