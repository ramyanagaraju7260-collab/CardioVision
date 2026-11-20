"""
CardioVision AI — PDF Report Generation Service

Compiles comprehensive clinical intelligence reports including:
- Patient metadata and clinical vitals
- AI Multimodal Risk Assessment
- Retinal Microvascular Biomarkers (AVR, Density, Tortuosity, Caliber)
- Traditional Risk Scores (Framingham & ASCVD) with Discordance Analysis
- Retinal Fundus and Saliency Heatmap imagery
- Medical decision-support disclaimer
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Brand colors
DEEP_TEAL = colors.HexColor("#004d40")
MINT = colors.HexColor("#10b981")
GRAPHITE = colors.HexColor("#334155")
SLATE = colors.HexColor("#64748b")
MIST = colors.HexColor("#e2e8f0")
BONE = colors.HexColor("#f8fafc")


def generate_prediction_report(
    prediction_data: dict,
    patient_data: dict,
    clinical_data: dict,
    image_path: str,
    output_path: str,
    model_metrics: Optional[dict] = None,
    biomarkers: Optional[dict] = None,
    traditional_risk: Optional[dict] = None,
    heatmap_path: Optional[str] = None,
    cdss: Optional[dict] = None,
) -> str:
    """
    Generate a professional multi-section PDF report for a prediction.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=12 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle", parent=styles["Heading1"],
        fontSize=20, textColor=DEEP_TEAL, spaceAfter=2 * mm,
        fontName="Helvetica-Bold"
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle", parent=styles["Normal"],
        fontSize=10, textColor=SLATE, spaceAfter=4 * mm
    )
    section_style = ParagraphStyle(
        "SectionHead", parent=styles["Heading2"],
        fontSize=11, textColor=DEEP_TEAL, spaceBefore=4 * mm,
        spaceAfter=2 * mm, fontName="Helvetica-Bold"
    )
    body_style = ParagraphStyle(
        "BodyText", parent=styles["Normal"],
        fontSize=9, textColor=GRAPHITE, spaceAfter=1 * mm, leading=12
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer", parent=styles["Normal"],
        fontSize=7.5, textColor=SLATE, spaceBefore=4 * mm,
        spaceAfter=1 * mm, alignment=TA_CENTER, leading=10
    )
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontSize=7, textColor=SLATE, alignment=TA_CENTER
    )

    elements = []

    # 1. Header Banner
    elements.append(Paragraph("CardioVision AI Clinical Intelligence", title_style))
    elements.append(Paragraph("Multimodal Cardiovascular Risk Stratification & Retinal Microvascular Biomarker Report", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=MINT))
    elements.append(Spacer(1, 3 * mm))

    # 2. Report Metadata Table
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    meta_data = [
        ["Assessment ID", f"#{prediction_data.get('id', 'N/A')}", "Assessment Date", now],
        ["Model Version", f"v{prediction_data.get('model_version', '1.0.0')}", "Execution Mode", str(prediction_data.get('mode', 'DEMO')).upper()],
    ]
    meta_table = Table(meta_data, colWidths=[35 * mm, 50 * mm, 35 * mm, 54 * mm])
    meta_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 0), (0, -1), SLATE),
        ("TEXTCOLOR", (2, 0), (2, -1), SLATE),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 3 * mm))

    # 3. Patient Demographics & Clinical Profile
    elements.append(Paragraph("Patient Information & Clinical Baseline", section_style))
    pt_table_data = [
        ["Patient Code", patient_data.get("patient_code", "N/A"), "Systolic / Diastolic BP", f"{clinical_data.get('systolic_bp', 'N/A')} / {clinical_data.get('diastolic_bp', 'N/A')} mmHg"],
        ["Full Name", patient_data.get("name", "N/A"), "Total Cholesterol", f"{clinical_data.get('cholesterol', 'N/A')} mg/dL"],
        ["Age / Gender", f"{patient_data.get('age', 'N/A')} yrs / {patient_data.get('gender', 'N/A')}", "Body Mass Index (BMI)", f"{clinical_data.get('bmi', 'N/A')} kg/m²"],
        ["Smoking Status", str(clinical_data.get("smoking_status", "N/A")).capitalize(), "Diabetes Status", "Yes" if clinical_data.get("diabetes") else "No"],
    ]
    pt_table = Table(pt_table_data, colWidths=[35 * mm, 50 * mm, 45 * mm, 44 * mm])
    pt_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("BACKGROUND", (0, 0), (-1, -1), BONE),
        ("TEXTCOLOR", (0, 0), (0, -1), SLATE),
        ("TEXTCOLOR", (2, 0), (2, -1), SLATE),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
    ]))
    elements.append(pt_table)
    elements.append(Spacer(1, 3 * mm))

    # 4. Primary AI Risk Assessment
    elements.append(Paragraph("AI Multimodal Risk Stratification", section_style))
    risk_level = prediction_data.get("risk_level", "LOW_RISK")
    risk_prob = float(prediction_data.get("risk_probability", 0.0))
    if risk_level == "HIGH_RISK":
        r_color = colors.HexColor("#dc2626")
        r_label = "HIGH RISK"
    elif risk_level == "MEDIUM_RISK":
        r_color = colors.HexColor("#d97706")
        r_label = "MEDIUM RISK"
    else:
        r_color = colors.HexColor("#16a34a")
        r_label = "LOW RISK"

    risk_summary_data = [
        ["Predicted Risk Category", Paragraph(f'<font color="{r_color.hexval()}"><b>{r_label}</b></font>', body_style)],
        ["Calculated Risk Probability", f"{risk_prob * 100:.1f}%"],
        ["Risk Tier Classification", f"Low (<30%) | Medium (30–59%) | High (≥60%)"],
        ["Calculated Score Spread", f"Low: {(1.0 - risk_prob) * 100:.1f}% | High: {risk_prob * 100:.1f}%"],
    ]
    r_table = Table(risk_summary_data, colWidths=[50 * mm, 124 * mm])
    r_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), SLATE),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ]))
    elements.append(r_table)
    elements.append(Spacer(1, 3 * mm))

    # 5. Retinal Microvascular Biomarkers (Computer Vision)
    if biomarkers and biomarkers.get("status") == "available":
        elements.append(Paragraph("Quantitative Retinal Microvascular Biomarkers", section_style))
        bio_rows = [["Biomarker", "Computed Value", "Reference Range", "Status"]]
        for m in biomarkers.get("markers_breakdown", []):
            bio_rows.append([
                m.get("name", "N/A"),
                f"{m.get('value', 'N/A')} {m.get('unit', '')}",
                m.get("refRange", "N/A"),
                m.get("status", "N/A")
            ])
        bio_table = Table(bio_rows, colWidths=[65 * mm, 35 * mm, 38 * mm, 36 * mm])
        bio_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("BACKGROUND", (0, 0), (-1, 0), DEEP_TEAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, MIST),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ]))
        elements.append(bio_table)
        if biomarkers.get("clinical_summary"):
            elements.append(Spacer(1, 2 * mm))
            elements.append(Paragraph(f"<b>Microvascular Finding:</b> {biomarkers.get('clinical_summary')}", body_style))
        elements.append(Spacer(1, 3 * mm))

    # 6. Traditional Risk Comparison (Framingham & ASCVD vs AI)
    if traditional_risk:
        elements.append(Paragraph("Comparative Analysis: AI vs. Traditional Risk Calculators", section_style))
        f_risk = traditional_risk.get("framingham", {})
        a_risk = traditional_risk.get("ascvd", {})
        disc = traditional_risk.get("discordance", {})

        trad_rows = [
            ["Risk Model", "Risk Score", "Risk Tier", "Target Outcome"],
            ["CardioVision AI (Multimodal)", f"{risk_prob * 100:.1f}%", r_label, "Subclinical & Systemic CVD Event"],
            ["Framingham CVD (2008)", f"{f_risk.get('risk_percentage', 0.0)}%", f_risk.get("category", "N/A"), "10-Year Total CVD Events"],
            ["AHA/ACC ASCVD (2014)", f"{a_risk.get('risk_percentage', 0.0)}%", a_risk.get("category", "N/A"), "10-Year Hard ASCVD Event (MI/Stroke)"],
        ]
        trad_table = Table(trad_rows, colWidths=[55 * mm, 30 * mm, 35 * mm, 54 * mm])
        trad_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, MIST),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ]))
        elements.append(trad_table)
        if disc.get("interpretation"):
            elements.append(Spacer(1, 2 * mm))
            elements.append(Paragraph(f"<b>Clinical Concordance Analysis:</b> {disc.get('interpretation')}", body_style))
        elements.append(Spacer(1, 3 * mm))

    # 7. Retinal Image Thumbnail(s)
    image_cells = []
    if image_path and Path(image_path).exists():
        try:
            image_cells.append(RLImage(image_path, width=42 * mm, height=42 * mm))
        except Exception:
            pass

    if heatmap_path and Path(heatmap_path).exists():
        try:
            image_cells.append(RLImage(heatmap_path, width=42 * mm, height=42 * mm))
        except Exception:
            pass

    if image_cells:
        elements.append(Paragraph("Ocular Imaging & Explainability Overlays", section_style))
        img_table = Table([image_cells])
        img_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(img_table)
        elements.append(Spacer(1, 3 * mm))

    # 8. Clinical Recommendation & Guideline-Based Care Pathway
    elements.append(Paragraph("Clinical Decision-Support Recommendation & Care Pathway", section_style))
    if cdss:
        statin = cdss.get("statin_therapy", {})
        bp_guidance = cdss.get("antihypertensive_therapy", {})
        eye = cdss.get("ophthalmology_referral", {})

        cdss_rows = [
            ["Clinical Domain", "Guideline-Concordant Action", "Recommendation Details"],
            ["Lipid / Statin", statin.get("tier", "Standard Evaluation"), statin.get("medication", "N/A")],
            ["Antihypertensive", bp_guidance.get("stage", "Blood Pressure"), bp_guidance.get("action", "N/A")],
            ["Ophthalmology", eye.get("grade", "Retinopathy"), eye.get("referral_urgency", "Routine Screening")],
        ]
        cdss_table = Table(cdss_rows, colWidths=[38 * mm, 50 * mm, 86 * mm])
        cdss_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BACKGROUND", (0, 0), (-1, 0), DEEP_TEAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, MIST),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
        ]))
        elements.append(cdss_table)
        elements.append(Spacer(1, 2 * mm))
    else:
        if risk_level == "HIGH_RISK":
            rec = (
                "The AI multimodal stratification indicates <b>ELEVATED CARDIOVASCULAR RISK</b>. "
                "Correlate with lipid panel, 24-hour ambulatory blood pressure, and consider cardiology referral "
                "for coronary calcium scoring or carotid ultrasound evaluation."
            )
        elif risk_level == "MEDIUM_RISK":
            rec = (
                "The AI multimodal stratification indicates <b>MODERATE / MEDIUM CARDIOVASCULAR RISK</b>. "
                "Recommend moderate-intensity statin consideration, strict BP monitoring (<130/80 mmHg), "
                "lifestyle optimization, and follow-up clinical evaluation within 3 to 6 months."
            )
        else:
            rec = (
                "The AI multimodal stratification indicates <b>LOW IMMEDIATE CARDIOVASCULAR RISK</b>. "
                "Continue standard lifestyle intervention, optimal nutrition, and routine biennial follow-up."
            )
        elements.append(Paragraph(rec, body_style))

    # 9. Disclaimers and Footer
    elements.append(Spacer(1, 4 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=MIST))
    elements.append(Paragraph(
        "MEDICAL DISCLAIMER: CardioVision AI is an academic decision-support research prototype and does not replace "
        "professional clinical diagnosis. AI-estimated risk scores must be evaluated by licensed medical practitioners.",
        disclaimer_style
    ))
    elements.append(Paragraph(
        f"Generated by CardioVision AI Platform — Confidential Medical Document — {now}",
        footer_style
    ))

    doc.build(elements)
    return output_path
