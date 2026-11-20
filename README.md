# CardioVision AI : Multimodal Cardiovascular and Clinical Health Records

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Academic_Research-blue?style=flat-square)](#disclaimer)

---

## 🏛️ Academic Institution & Project Affiliation

* **Institution:** **Sai Vidya Institute of Technology (SVIT)**  
  *(An Autonomous Institute under Visvesvaraya Technological University (VTU), Belagavi, Accredited by NBA & NAAC)*  
  Rajanukunte, Bengaluru, Karnataka – 560064  
* **Department:** **Department of Artificial Intelligence & Machine Learning (AIML)**  
* **Project Exhibition:** **TECHSPARDHA — Project Exhibition 2K26**  
* **YUKTI Innovation ID:** `IR2026-1059584`  
* **Project Guide:** **Mrs. Rekha Murthy**, Assistant Professor, Department of AIML, SVIT  

### 👥 Project Team Members
| Sl. No. | Student Name | Department | Role |
| :---: | :--- | :---: | :--- |
| 1 | **N Ramya** | AIML | System Architecture, Multimodal Modeling & Defense Lead |
| 2 | **Ruchitha N** | AIML | Retinal Microvascular Feature Extraction & Biomarkers |
| 3 | **G Ankitha** | AIML | Machine Learning Ensembling & Calibration Pipeline |
| 4 | **Nikhitha H L** | AIML | Explainable AI (Grad-CAM), Frontend & Clinical Reporting |

---

## 📖 Executive Summary & Abstract

Cardiovascular diseases (CVDs) remain the **#1 cause of mortality worldwide**, causing an estimated 17.9 million deaths annually. Traditional assessment calculators (Framingham Risk Score, Pooled Cohort ASCVD) depend solely on circulating blood markers and demographic statistics without directly assessing systemic vascular pathology, missing up to **40% of early-stage, subclinical microvascular damage**.

**CardioVision AI** introduces an **Oculomics-driven multimodal framework**. Retinal microvessels share identical embryonic, physiological, and anatomical wall structures with coronary arteries in the heart. By capturing non-invasive retinal fundus photographs and fusing them with routine patient Clinical Health Records (EHR), CardioVision AI predicts cardiovascular risk accurately, non-invasively, and with full Explainable AI (XAI).

---

## ✨ Key System Features

1. **Multimodal Late Feature Fusion:**
   - **4 Retinal Biomarkers:** Arteriolar-to-Venular Ratio (AVR), Vessel Density, Vessel Tortuosity Index, and Mean Vessel Caliber.
   - **8 Clinical Health Parameters:** Age, Gender, Systolic BP, Diastolic BP, Total Cholesterol, BMI, Diabetes Status, and Smoking Status.
   - Integrated into a calibrated **12-feature unified representation**.
2. **Machine Learning Ensemble & Calibration:**
   - Complementary ensemble of **Random Forest** and **HistGradientBoosting**.
   - **Soft Voting** for smooth probability distribution and **Sigmoid Calibration (Platt Scaling)** for true clinical calibration.
3. **Explainable AI (XAI):**
   - **Grad-CAM attention heatmaps** highlight microvascular arcades and regions contributing to high risk.
   - Vessel segmentation and opacity controls for transparent physician auditing.
4. **Clinical Safety & OOD Filtering:**
   - **Chorioretinal Spectral Validator** rejects non-retinal images (faces, rooms, objects) using hemoglobin spectral absorption optics ($R/B \ge 1.7$).
5. **Interactive Clinical Decision Support (CDSS):**
   - **3-Tier Risk Stratification:** Low (<30%), Medium (30–59.9%), High (≥60%).
   - Multi-model discordance benchmarking against Framingham and ACC/AHA guidelines.
   - **Interactive "What-If" Simulator** to project risk reduction from clinical interventions.
   - One-click **Clinical PDF Reports** and **HL7 FHIR JSON** interoperability bundles.

---

## 🏗️ System Architecture & Workflow

```
[ Patient Inputs ]
  ├── 1. Clinical EHR Records  ──> Imputation & Scaling ──> 8 Clinical Features
  │    (Age, SBP, DBP, Chol, BMI, Diabetes, Smoking)
  │                                                               ──> [ Multimodal Late Fusion Ensemble ]
  └── 2. Retinal Fundus Scan ──> [ Chorioretinal OOD Validator ]      (Random Forest + HistGradientBoosting)
                                 ├── Rejects Non-Retinal (HTTP 400)               │
                                 └── Passes Valid Fundus Image                    ▼
                                         │                           ┌───────────────────────────┐
                                         ├──> Retinal Biomarkers ───>│ Risk Probability (0 - 100%)│
                                         │    (AVR, Tortuosity,      │ 3-Tier Risk Stratification │
                                         │     Density, Caliber)     │ Multi-Model Discordance    │
                                         │                           │ CDSS Medical Pathway       │
                                         └──> Explainable AI (XAI) ─>│ Grad-CAM Attention Heatmap│
                                              (Grad-CAM, Saliency)   └───────────────────────────┘
                                                                                  │
                                                                   ┌──────────────┴──────────────┐
                                                                   ▼                             ▼
                                                           [ Interactive UI ]           [ Interoperability ]
                                                           - Risk Gauge & Sliders       - Clinical PDF Report
                                                           - What-If Simulator          - HL7 FHIR JSON Bundle
```

---

## 🔬 Mathematical Formulations

### 1. Arteriolar-to-Venular Ratio (AVR)
$$\text{AVR} = \frac{\text{CRAE}}{\text{CRVE}}$$
*Normal Range: $0.67 - 0.75$. Values $< 0.60$ indicate severe arteriolar narrowing caused by systemic hypertension and arterial stiffness.*

### 2. Microvascular Vessel Tortuosity Index ($\tau$)
$$\tau = \frac{L_{\text{arc}}}{L_{\text{chord}}} = \frac{\int \sqrt{1 + (f'(x))^2} \, dx}{\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}}$$
*Healthy Range: $1.05 - 1.15$. Elevated tortuosity ($>1.20$) indicates high shear stress and endothelial remodeling.*

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS v4, Lucide React, Recharts, React Router |
| **Backend & API**| Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic v2 |
| **ML & Vision** | Scikit-Learn, OpenCV, NumPy, Pandas, ReportLab |
| **Standards** | HL7 FHIR Release 4 JSON specification |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** v18 or later
* **Python:** v3.11 or later
* **Git** installed on your system

### 1. Clone the Repository
```bash
git clone https://github.com/ramyanagaraju7260-collab/CardioVision_AI.git
cd CardioVision_AI
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend runs at `http://localhost:8000` (API documentation at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## ⚖️ Disclaimer

**CardioVision AI is an academic research prototype developed for educational and decision-support demonstration purposes at Sai Vidya Institute of Technology (SVIT).** It does not replace certified clinical diagnosis, treatment, or professional medical advice.
