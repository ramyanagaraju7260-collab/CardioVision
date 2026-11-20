"""
CardioVision AI — Traditional Cardiovascular Risk Calculator

Implements validated gold-standard clinical cardiovascular risk models:
1. Framingham 10-Year Cardiovascular Disease Risk Score (D'Agostino et al., 2008)
2. AHA/ACC ASCVD 10-Year Risk Pooled Cohort Equations (Goff et al., 2014)
3. Discordance Analysis between systemic clinical guidelines and retinal microvascular AI
"""

import math
from typing import Dict, Any


def calculate_framingham_risk(
    age: float,
    gender: str,
    systolic_bp: float,
    cholesterol: float,
    smoking: str,
    diabetes: bool,
    hdl: float = 50.0,
    bp_treated: bool = False
) -> Dict[str, Any]:
    """
    Computes 10-year risk of cardiovascular disease using the Framingham Risk Equation.
    """
    is_male = str(gender).strip().lower().startswith('m')
    is_smoker = str(smoking).strip().lower() == 'current'
    is_diabetic = bool(diabetes)

    # Clamp values to standard validation limits
    c_age = max(30.0, min(79.0, float(age)))
    c_chol = max(130.0, min(320.0, float(cholesterol)))
    c_hdl = max(20.0, min(100.0, float(hdl)))
    c_sbp = max(90.0, min(200.0, float(systolic_bp)))

    ln_age = math.log(c_age)
    ln_chol = math.log(c_chol)
    ln_hdl = math.log(c_hdl)
    ln_sbp = math.log(c_sbp)

    if is_male:
        sbp_coeff = 1.99881 if bp_treated else 1.93303
        linear_combo = (
            3.06117 * ln_age
            + 1.12370 * ln_chol
            - 0.93263 * ln_hdl
            + sbp_coeff * ln_sbp
            + (0.65451 if is_smoker else 0.0)
            + (0.57367 if is_diabetic else 0.0)
            - 23.9802
        )
        base_survival = 0.88936
    else:
        sbp_coeff = 2.82263 if bp_treated else 2.76157
        linear_combo = (
            2.32888 * ln_age
            + 1.20904 * ln_chol
            - 0.70833 * ln_hdl
            + sbp_coeff * ln_sbp
            + (0.52873 if is_smoker else 0.0)
            + (0.69154 if is_diabetic else 0.0)
            - 26.1931
        )
        base_survival = 0.95012

    risk_prob = 1.0 - math.pow(base_survival, math.exp(linear_combo))
    risk_pct = round(max(1.0, min(95.0, risk_prob * 100.0)), 1)

    if risk_pct < 10.0:
        category = "Low Risk"
        color = "#16a34a"
    elif risk_pct < 20.0:
        category = "Intermediate Risk"
        color = "#d97706"
    else:
        category = "High Risk"
        color = "#dc2626"

    return {
        "score_name": "Framingham 10-Year CVD",
        "risk_percentage": risk_pct,
        "category": category,
        "color": color,
        "standard_threshold": 20.0,
        "description": "Estimates 10-year probability of total cardiovascular events (coronary, cerebrovascular, peripheral artery, and heart failure)."
    }


def calculate_ascvd_risk(
    age: float,
    gender: str,
    systolic_bp: float,
    cholesterol: float,
    smoking: str,
    diabetes: bool,
    hdl: float = 50.0,
    bp_treated: bool = False
) -> Dict[str, Any]:
    """
    Estimates 10-year risk of hard ASCVD (myocardial infarction or stroke)
    using ACC/AHA Pooled Cohort Equations.
    """
    is_male = str(gender).strip().lower().startswith('m')
    is_smoker = str(smoking).strip().lower() == 'current'
    is_diabetic = bool(diabetes)

    c_age = max(40.0, min(79.0, float(age)))
    c_chol = max(130.0, min(320.0, float(cholesterol)))
    c_hdl = max(20.0, min(100.0, float(hdl)))
    c_sbp = max(90.0, min(200.0, float(systolic_bp)))

    ln_age = math.log(c_age)
    ln_chol = math.log(c_chol)
    ln_hdl = math.log(c_hdl)
    ln_sbp = math.log(c_sbp)

    if is_male:
        indiv_sum = (
            12.344 * ln_age
            + 11.853 * ln_chol
            - 2.664 * ln_age * ln_chol
            - 7.990 * ln_hdl
            + 1.769 * ln_age * ln_hdl
            + (1.797 if bp_treated else 1.764) * ln_sbp
            + (7.837 if is_smoker else 0.0)
            - (1.795 * ln_age if is_smoker else 0.0)
            + (0.658 if is_diabetic else 0.0)
        )
        mean_sum = 61.18
        baseline_survival = 0.9144
    else:
        indiv_sum = (
            -29.799 * ln_age
            + 4.884 * (ln_age ** 2)
            + 13.540 * ln_chol
            - 3.114 * ln_age * ln_chol
            - 13.578 * ln_hdl
            + 3.149 * ln_age * ln_hdl
            + (2.019 if bp_treated else 1.957) * ln_sbp
            + (7.574 if is_smoker else 0.0)
            - (1.665 * ln_age if is_smoker else 0.0)
            + (0.661 if is_diabetic else 0.0)
        )
        mean_sum = -29.18
        baseline_survival = 0.9665

    risk_prob = 1.0 - math.pow(baseline_survival, math.exp(indiv_sum - mean_sum))
    risk_pct = round(max(0.5, min(95.0, risk_prob * 100.0)), 1)

    if risk_pct < 5.0:
        category = "Low Risk"
        color = "#16a34a"
    elif risk_pct < 7.5:
        category = "Borderline Risk"
        color = "#2563eb"
    elif risk_pct < 20.0:
        category = "Intermediate Risk"
        color = "#d97706"
    else:
        category = "High Risk"
        color = "#dc2626"

    return {
        "score_name": "AHA/ACC ASCVD 10-Year",
        "risk_percentage": risk_pct,
        "category": category,
        "color": color,
        "standard_threshold": 7.5,
        "description": "Predicts 10-year risk of first fatal or non-fatal myocardial infarction or stroke."
    }


def analyze_risk_discordance(
    ai_risk_prob: float,
    framingham_pct: float,
    biomarkers: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Analyzes concordance/discordance between the AI multimodal risk and traditional Framingham scores.
    Detects subclinical microvascular damage in apparently low-risk patients.
    """
    ai_pct = round(ai_risk_prob * 100.0, 1)
    avr = biomarkers.get("avr", 0.68) if biomarkers else 0.68
    tortuosity = biomarkers.get("vessel_tortuosity", 1.12) if biomarkers else 1.12

    delta = round(ai_pct - framingham_pct, 1)

    if delta > 15.0:
        status = "Subclinical Microvascular Risk Detected"
        interpretation = (
            f"AI multimodal prediction ({ai_pct}%) is substantially higher than traditional Framingham score ({framingham_pct}%). "
            f"Retinal biomarkers (AVR {avr:.2f}, tortuosity {tortuosity:.3f}) reveal early structural microvascular changes "
            "that precede overt systemic cardiovascular events."
        )
        alert_level = "warning"
    elif delta < -15.0:
        status = "Preserved Retinal Microvasculature"
        interpretation = (
            f"Traditional clinical scores ({framingham_pct}%) indicate elevated risk, but retinal imaging shows preserved "
            f"microvascular integrity (AVR {avr:.2f}), suggesting absence of severe target-organ damage."
        )
        alert_level = "info"
    else:
        status = "Concordant Assessment"
        interpretation = (
            f"AI multimodal model ({ai_pct}%) and traditional Framingham guidelines ({framingham_pct}%) are closely aligned, "
            "confirming consistent risk stratification across ocular and systemic biomarkers."
        )
        alert_level = "neutral"

    return {
        "status": status,
        "delta_percentage": delta,
        "interpretation": interpretation,
        "alert_level": alert_level
    }
