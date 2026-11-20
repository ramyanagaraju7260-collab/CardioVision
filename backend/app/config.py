"""
CardioVision AI — Application Configuration
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads")
REPORTS_DIR = BASE_DIR / os.getenv("REPORTS_DIR", "reports")
ML_ARTIFACTS_DIR = BASE_DIR / "app" / "ml" / "artifacts"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Application mode
APP_MODE = os.getenv("APP_MODE", "demo")  # "demo" or "production"

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cardiovision.db")

# Model
MODEL_THRESHOLD = float(os.getenv("MODEL_THRESHOLD", "0.50"))
MODEL_LOW_THRESHOLD = float(os.getenv("MODEL_LOW_THRESHOLD", "0.30"))
MODEL_HIGH_THRESHOLD = float(os.getenv("MODEL_HIGH_THRESHOLD", "0.60"))
MODEL_VERSION = os.getenv("MODEL_VERSION", "2.0.0")

# Upload constraints
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "16"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"}

# Server
BACKEND_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
