"""
CardioVision AI — Clinical Decision Support System (CDSS)

Translates multimodal cardiovascular risk predictions and retinal microvascular
biomarkers into actionable, guideline-concordant medical decisions:
- ACC/AHA 2019 Guideline on the Primary Prevention of Cardiovascular Disease
- 2017 ACC/AHA / 2020 ISH Hypertension Clinical Practice Guidelines
- Keith-Wagener-Barker Retinopathy & Microvascular Staging
- ADA 2024 Standards of Medical Care in Diabetes (Cardiovascular Section)
"""

from typing import Dict, Any, List


def generate_cdss_recommendations(
    risk_probability: float,
    risk_level: str,
    clinical_data: Dict[str, Any],
    biomarkers: Dict[str, Any],
    traditional_risk: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generates structured clinical decision support recommendations.
    """
    age = float(clinical_data.get("age", 50))
    gender = str(clinical_data.get("gender", "Unknown"))
    sbp = float(clinical_data.get("systolic_bp", 120))
    dbp = float(clinical_data.get("diastolic_bp", 80))
    chol = float(clinical_data.get("cholesterol", 200))
    bmi = float(clinical_data.get("bmi", 24))
    diabetes = bool(clinical_data.get("diabetes", False))
    smoking = str(clinical_data.get("smoking_status", "never")).lower()

    avr = float(biomarkers.get("avr", 0.68))
    tortuosity = float(biomarkers.get("vessel_tortuosity", 1.12))
    density = float(biomarkers.get("vessel_density", 11.0))

    ascvd_pct = traditional_risk.get("ascvd", {}).get("risk_percentage", risk_probability * 100)
    framingham_pct = traditional_risk.get("framingham", {}).get("risk_percentage", risk_probability * 100)
    discordance = traditional_risk.get("discordance", {})
    has_discordance = discordance.get("discordant", False)

    recommendations: List[Dict[str, str]] = []
    medications: List[Dict[str, str]] = []
    targets: List[Dict[str, str]] = []
    lifestyle: List[str] = []

    # -------------------------------------------------------------
    # 1. Statin Therapy Guidance (ACC/AHA 2019)
    # -------------------------------------------------------------
    statin_guidance = {}
    if risk_probability >= 0.20 or ascvd_pct >= 20.0 or chol >= 280:
        statin_guidance = {
            "tier": "High-Intensity Statin Recommended",
            "medication": "Atorvastatin 40–80 mg daily OR Rosuvastatin 20–40 mg daily",
            "guideline": "ACC/AHA 2019 Primary Prevention §4.2 (High CVD Risk Category / Secondary Target)",
            "rationale": f"CardioVision Risk is {(risk_probability*100):.1f}% with severe microvascular/clinical markers. High-intensity statin achieves ≥50% LDL-C reduction."
        }
        medications.append({
            "category": "Lipid Lowering",
            "drug": "Atorvastatin 40 mg PO qHS (or Rosuvastatin 20 mg PO daily)",
            "indication": "High CVD Risk / Primary Prevention"
        })
    elif risk_probability >= 0.075 or ascvd_pct >= 7.5 or diabetes:
        statin_guidance = {
            "tier": "Moderate-Intensity Statin Recommended",
            "medication": "Atorvastatin 10–20 mg daily OR Rosuvastatin 5–10 mg daily",
            "guideline": "ACC/AHA 2019 §4.2 / ADA 2024 Standards of Care",
            "rationale": "Intermediate CVD risk profile (7.5%–19.9%) or comorbid Type 2 Diabetes warrants moderate-intensity statin therapy (30%–49% LDL-C reduction)."
        }
        medications.append({
            "category": "Lipid Lowering",
            "drug": "Atorvastatin 20 mg PO qHS",
            "indication": "Intermediate Risk / Diabetic Atherosclerosis Prophylaxis"
        })
    else:
        statin_guidance = {
            "tier": "Lifestyle Intervention First",
            "medication": "Statins not immediately indicated; re-evaluate annually or consider CAC scoring if family history present.",
            "guideline": "ACC/AHA 2019 Primary Prevention §4.1 (Low Risk Profile)",
            "rationale": "Cardiovascular risk is below the 7.5% therapeutic threshold."
        }

    # -------------------------------------------------------------
    # 2. Antihypertensive Management (2017 ACC/AHA / 2020 ISH)
    # -------------------------------------------------------------
    bp_category = "Normal"
    bp_recommendation = {}

    if sbp >= 180 or dbp >= 120:
        bp_category = "Hypertensive Urgency / Crisis"
        bp_recommendation = {
            "stage": "Hypertensive Crisis",
            "urgency": "Immediate Emergency Assessment",
            "guideline": "2017 ACC/AHA High Blood Pressure Guidelines §11.2",
            "action": "Immediate medical evaluation for acute target organ damage. Consider oral antihypertensives (e.g. Captopril, Labetalol, Clonidine) in monitored setting."
        }
        medications.append({
            "category": "Antihypertensive",
            "drug": "Urgent Medical Evaluation Required",
            "indication": f"Severe Hypertension (SBP {sbp:.0f} / DBP {dbp:.0f} mmHg)"
        })
    elif sbp >= 140 or dbp >= 90:
        bp_category = "Stage 2 Hypertension"
        bp_recommendation = {
            "stage": "Stage 2 Hypertension",
            "urgency": "High Priority Initiation",
            "guideline": "2017 ACC/AHA §8.1 / 2020 ISH Essential Guidelines",
            "action": "Prompt initiation of dual-agent pharmacotherapy from two distinct first-line classes (ACE-i/ARB + Dihydropyridine CCB or Thiazide diuretic)."
        }
        medications.append({
            "category": "Antihypertensive (Dual Therapy)",
            "drug": "Lisinopril 10 mg + Amlodipine 5 mg PO daily (or Losartan 50 mg + Amlodipine 5 mg)",
            "indication": f"Stage 2 HTN (BP: {sbp:.0f}/{dbp:.0f} mmHg)"
        })
    elif sbp >= 130 or dbp >= 80:
        bp_category = "Stage 1 Hypertension"
        if risk_probability >= 0.10:
            bp_recommendation = {
                "stage": "Stage 1 Hypertension with Elevated CVD Risk",
                "urgency": "Pharmacotherapy Recommended",
                "guideline": "2017 ACC/AHA §8.1.2",
                "action": "Initiate first-line monotherapy (ACE-i, ARB, or CCB) combined with aggressive non-pharmacologic lifestyle measures."
            }
            medications.append({
                "category": "Antihypertensive (Monotherapy)",
                "drug": "Amlodipine 5 mg PO daily (or Lisinopril 10 mg PO daily)",
                "indication": "Stage 1 HTN with >10% 10-Year CVD Risk"
            })
        else:
            bp_recommendation = {
                "stage": "Stage 1 Hypertension (Low CVD Risk)",
                "urgency": "Non-Pharmacologic Trial",
                "guideline": "2017 ACC/AHA §8.1.1",
                "action": "3–6 month trial of lifestyle modification (DASH dietary pattern, sodium restriction, weight reduction, aerobic exercise)."
            }
    else:
        bp_category = "Normal / Controlled Blood Pressure"
        bp_recommendation = {
            "stage": "Normotensive",
            "urgency": "Maintenance",
            "guideline": "2017 ACC/AHA §3.1",
            "action": "Maintain healthy lifestyle habits. Annual BP re-screening."
        }

    # -------------------------------------------------------------
    # 3. Retinal Microvascular & Ophthalmology Guidance
    # -------------------------------------------------------------
    retinopathy_grade = "Grade 0 (Normal)"
    ophthalmology_action = {}

    if avr < 0.60 or tortuosity > 1.25:
        retinopathy_grade = "Grade II (Moderate Hypertensive Microangiopathy)"
        ophthalmology_action = {
            "grade": retinopathy_grade,
            "referral_urgency": "Semi-Urgent Comprehensive Dilated Eye Exam (Within 4–6 Weeks)",
            "finding": f"Marked arteriolar narrowing (AVR: {avr:.2f}) and high tortuosity ({tortuosity:.2f}) indicating persistent end-organ microvascular stress.",
            "clinical_significance": "Retinal microvascular remodeling correlates with cerebral small-vessel disease and subclinical myocardial ischemia."
        }
    elif avr < 0.67 or tortuosity > 1.18:
        retinopathy_grade = "Grade I (Mild Arteriolar Attenuation)"
        ophthalmology_action = {
            "grade": retinopathy_grade,
            "referral_urgency": "Routine Ophthalmology Evaluation (Within 3–6 Months)",
            "finding": f"Generalized arteriolar caliber reduction (AVR: {avr:.2f}).",
            "clinical_significance": "Early microvascular response to systemic vascular resistance."
        }
    else:
        retinopathy_grade = "Grade 0 (Preserved Microvasculature)"
        ophthalmology_action = {
            "grade": retinopathy_grade,
            "referral_urgency": "Standard Annual Diabetic/Hypertensive Retinal Screening",
            "finding": f"Normal Arteriolar-to-Venular Ratio (AVR: {avr:.2f}) and physiological vessel tortuosity.",
            "clinical_significance": "No evident hypertensive microvascular decompensation."
        }

    # -------------------------------------------------------------
    # 4. Antiplatelet (Aspirin) Consideration
    # -------------------------------------------------------------
    aspirin_guidance = {}
    if 40 <= age <= 70 and risk_probability >= 0.15:
        aspirin_guidance = {
            "recommendation": "Consider Low-Dose Aspirin (81 mg daily)",
            "guideline": "ACC/AHA 2019 §4.3 (Primary Prevention Aspirin)",
            "caveat": "Appropriate only if patient has low bleeding risk (no prior GI bleed, thrombocytopenia, or concurrent anticoagulant use)."
        }
    else:
        aspirin_guidance = {
            "recommendation": "Routine Aspirin Not Recommended",
            "guideline": "ACC/AHA 2019 §4.3",
            "caveat": "Bleeding risks outweigh ischemic benefits in low/moderate risk primary prevention."
        }

    # -------------------------------------------------------------
    # 5. Target Biomarker Goals
    # -------------------------------------------------------------
    targets = [
        {"biomarker": "Systolic Blood Pressure", "target": "< 130 mmHg", "current": f"{sbp:.0f} mmHg", "status": "Controlled" if sbp < 130 else "Uncontrolled"},
        {"biomarker": "Diastolic Blood Pressure", "target": "< 80 mmHg", "current": f"{dbp:.0f} mmHg", "status": "Controlled" if dbp < 80 else "Uncontrolled"},
        {"biomarker": "Total Cholesterol", "target": "< 190 mg/dL", "current": f"{chol:.0f} mg/dL", "status": "At Goal" if chol < 190 else "Elevated"},
        {"biomarker": "Body Mass Index", "target": "18.5 – 24.9 kg/m²", "current": f"{bmi:.1f} kg/m²", "status": "Normal" if bmi < 25 else "Overweight/Obese"},
        {"biomarker": "Retinal AVR", "target": "≥ 0.67", "current": f"{avr:.2f}", "status": "Preserved" if avr >= 0.67 else "Arteriolar Narrowing"}
    ]

    # -------------------------------------------------------------
    # 6. Lifestyle & Behavioral Interventions
    # -------------------------------------------------------------
    lifestyle.append("DASH Dietary Pattern: High intake of vegetables, fruits, whole grains, lean poultry, and nuts; sodium intake restricted to < 2,000 mg/day.")
    lifestyle.append("Aerobic Physical Exercise: Minimum 150 minutes/week of moderate-intensity aerobic exercise (e.g. brisk walking) or 75 minutes of vigorous exercise.")
    if smoking == "current":
        lifestyle.append("URGENT Smoking Cessation: Enroll in structured behavioral counseling combined with first-line pharmacotherapy (Varenicline or Nicotine Replacement Therapy).")
    if bmi >= 25.0:
        lifestyle.append(f"Weight Management: Target 5%–10% body weight reduction over 6 months to improve insulin sensitivity and hemodynamic resistance.")

    # -------------------------------------------------------------
    # 7. Formatted EHR Copyable Clinical Note
    # -------------------------------------------------------------
    ehr_note = (
        f"CARDIOVASCULAR RISK ASSESSMENT & CLINICAL DECISION SUPPORT SUMMARY\n"
        f"Patient: {clinical_data.get('patient_name', 'Patient')} | Age: {age:.0f} | Gender: {gender}\n"
        f"Date: {clinical_data.get('date', 'Today')}\n\n"
        f"1. RISK STRATIFICATION:\n"
        f"- CardioVision AI Multimodal Risk: {(risk_probability * 100):.1f}% [{risk_level.replace('_', ' ')}]\n"
        f"- Traditional Framingham 10-Yr: {framingham_pct:.1f}% | ASCVD 10-Yr: {ascvd_pct:.1f}%\n"
        f"{'- NOTE: Significant discordance detected between microvascular retinal signs and traditional risk.' if has_discordance else '- Traditional and AI models concordant.'}\n\n"
        f"2. CLINICAL VITALS & RETINAL BIOMARKERS:\n"
        f"- Blood Pressure: {sbp:.0f}/{dbp:.0f} mmHg ({bp_category})\n"
        f"- Total Cholesterol: {chol:.0f} mg/dL | BMI: {bmi:.1f} kg/m²\n"
        f"- Retinal AVR: {avr:.2f} | Tortuosity: {tortuosity:.2f} | Vessel Density: {density:.1f}%\n"
        f"- Keith-Wagener-Barker Staging: {retinopathy_grade}\n\n"
        f"3. PHARMACOTHERAPY RECOMMENDATIONS:\n"
        f"- Statin: {statin_guidance.get('tier', 'None')} ({statin_guidance.get('medication', '')})\n"
        f"- Antihypertensive: {bp_recommendation.get('action', 'Lifestyle maintenance')}\n"
        f"- Antiplatelet: {aspirin_guidance.get('recommendation', 'None')}\n\n"
        f"4. REFERRALS & FOLLOW-UP:\n"
        f"- Cardiology / Primary Care Review: Follow up in {('2-4 weeks' if risk_level == 'HIGH_RISK' else ('3 months' if risk_level == 'MEDIUM_RISK' else '6-12 months'))}.\n"
    )

    return {
        "summary": {
            "risk_level": risk_level,
            "risk_probability": risk_probability,
            "bp_category": bp_category,
            "retinopathy_stage": retinopathy_grade,
            "discordance_flag": has_discordance
        },
        "statin_therapy": statin_guidance,
        "antihypertensive_therapy": bp_recommendation,
        "ophthalmology_referral": ophthalmology_action,
        "aspirin_guidance": aspirin_guidance,
        "recommended_medications": medications,
        "target_goals": targets,
        "lifestyle_prescriptions": lifestyle,
        "ehr_clinical_note": ehr_note
    }
