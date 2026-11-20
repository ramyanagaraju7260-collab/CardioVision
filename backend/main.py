"""
CardioVision AI — FastAPI Application Entry Point

AI-Driven Cardiovascular Risk Stratification Using Retinal
Microvascular Biomarkers and Explainable Deep Learning
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import APP_MODE, BACKEND_HOST, BACKEND_PORT
from app.database import init_db
from app.ml.model_service import get_model_service
from app.api import (
    health_router, patients_router, clinical_router,
    images_router, predictions_router, model_router,
    batch_router, fhir_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    print(f"[CardioVision AI] Starting in {APP_MODE.upper()} mode...")
    init_db()
    print("[CardioVision AI] Database initialized.")
    get_model_service()
    print("[CardioVision AI] Model service ready.")
    yield
    # Shutdown
    print("[CardioVision AI] Shutting down...")


app = FastAPI(
    title="CardioVision AI",
    description=(
        "AI-Driven Cardiovascular Risk Stratification Using Retinal "
        "Microvascular Biomarkers and Explainable Deep Learning. "
        "This system is intended for academic/research decision support "
        "and does not replace professional medical diagnosis."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(patients_router, prefix="/api", tags=["Patients"])
app.include_router(clinical_router, prefix="/api", tags=["Clinical"])
app.include_router(images_router, prefix="/api", tags=["Images"])
app.include_router(predictions_router, prefix="/api", tags=["Predictions"])
app.include_router(model_router, prefix="/api", tags=["Model"])
app.include_router(batch_router, prefix="/api", tags=["Batch"])
app.include_router(fhir_router, prefix="/api", tags=["FHIR"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=BACKEND_HOST, port=BACKEND_PORT, reload=True)
