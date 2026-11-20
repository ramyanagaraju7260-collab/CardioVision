"""
CardioVision AI — Image Upload API Router
"""

from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import UPLOAD_DIR, MAX_UPLOAD_SIZE_BYTES, ALLOWED_IMAGE_EXTENSIONS, ALLOWED_MIME_TYPES
from app.models.patient import Patient
from app.models.retinal_image import RetinalImage
from app.ml.image_preprocessing import validate_image_file
from app.utils.helpers import generate_unique_filename

router = APIRouter()


@router.post("/images/upload")
async def upload_retinal_image(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail={
            "error": "PATIENT_NOT_FOUND",
            "message": f"Patient with ID {patient_id} not found."
        })

    # Validate file extension
    original_name = file.filename or "unknown"
    ext = Path(original_name).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail={
            "error": "INVALID_FILE_TYPE",
            "message": f"Unsupported file type '{ext}'. Allowed: JPEG, JPG, PNG."
        })

    # Validate MIME type
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail={
            "error": "INVALID_MIME_TYPE",
            "message": f"Unsupported MIME type '{file.content_type}'."
        })

    # Read and validate file size
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail={
            "error": "EMPTY_FILE",
            "message": "The uploaded file is empty."
        })
    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=400, detail={
            "error": "FILE_TOO_LARGE",
            "message": f"File exceeds maximum size of {MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
        })

    # Save file with unique name
    unique_name = generate_unique_filename(original_name)
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as f:
        f.write(contents)

    # Validate image can be decoded
    validation = validate_image_file(str(file_path))
    if not validation["valid"]:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail={
            "error": "INVALID_RETINAL_IMAGE",
            "message": validation["error"]
        })

    # Persist to database
    image_record = RetinalImage(
        patient_id=patient_id,
        image_path=unique_name,
        original_filename=original_name,
        quality_status="validated",
    )
    db.add(image_record)
    db.commit()
    db.refresh(image_record)

    return {
        "image_id": image_record.id,
        "filename": unique_name,
        "original_filename": original_name,
        "file_path": str(file_path),
        "size_bytes": len(contents),
        "quality_status": "validated",
        "patient_id": patient_id,
    }


@router.get("/images/{filename}")
async def get_image(filename: str):
    """Serve an uploaded image."""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail={
            "error": "IMAGE_NOT_FOUND",
            "message": "Image file not found."
        })
    return FileResponse(str(file_path))
