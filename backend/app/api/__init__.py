from app.api.health import router as health_router
from app.api.patients import router as patients_router
from app.api.clinical import router as clinical_router
from app.api.images import router as images_router
from app.api.predictions import router as predictions_router
from app.api.model import router as model_router
from app.api.batch import router as batch_router
from app.api.fhir import router as fhir_router

__all__ = [
    "health_router", "patients_router", "clinical_router",
    "images_router", "predictions_router", "model_router",
    "batch_router", "fhir_router"
]

