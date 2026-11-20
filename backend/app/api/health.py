"""
CardioVision AI — Health Check Router
"""

from fastapi import APIRouter
from app.config import APP_MODE, MODEL_VERSION

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "CardioVision AI",
        "mode": APP_MODE,
        "model_version": MODEL_VERSION
    }
