"""
CardioVision AI — Image Preprocessing Pipeline

Handles retinal fundus image preprocessing:
- Format validation
- Decoding
- Crop/border removal
- Resize
- Normalization
- Optional contrast enhancement
"""

import cv2
import numpy as np
from pathlib import Path


TARGET_SIZE = (224, 224)


def validate_image_file(file_path: str) -> dict:
    """
    Validate that a file is a decodable retinal fundus photograph.
    Rejects out-of-distribution non-retinal images (selfies, objects, dustbins, rooms, documents).
    Returns {"valid": True} or {"valid": False, "error": "..."}.
    """
    path = Path(file_path)
    if not path.exists():
        return {"valid": False, "error": "File does not exist"}

    if path.stat().st_size == 0:
        return {"valid": False, "error": "File is empty"}

    img = cv2.imread(str(path))
    if img is None:
        return {"valid": False, "error": "File could not be decoded as a supported image"}

    h, w = img.shape[:2]
    if h < 80 or w < 80:
        return {"valid": False, "error": "Image resolution is too low (minimum 80x80 pixels)"}

    # 1. Scientific Retinal Fundus Color Analysis
    # Retinal fundus tissue consists of melanin, perfused choroid, and retinal vessels.
    # Hemoglobin and retinal pigment epithelium absorb blue light strongly and reflect red/orange.
    # Therefore genuine ophthalmic fundus images exhibit a distinct chorioretinal color signature:
    # Red is significantly higher than Blue (R/B >= 1.7) and Green (R/G >= 1.08).
    # General non-retinal photos (faces, rooms, objects, dustbins) have balanced RGB (R/B ~ 0.8-1.3).
    mean_b, mean_g, mean_r = cv2.mean(img)[:3]
    rb_ratio = mean_r / (mean_b + 1e-5)
    rg_ratio = mean_r / (mean_g + 1e-5)

    if rb_ratio < 1.7 or rg_ratio < 1.08:
        return {
            "valid": False,
            "error": "Invalid Retinal Image: The uploaded file does not appear to be a retinal fundus photograph. Retinal cardiovascular risk prediction requires an eye fundus scan showing retinal microvasculature. General photos (faces, objects, rooms) cannot be used."
        }

    # 2. Ophthalmic Camera Aperture & Periphery Check
    # Standard fundus cameras photograph through a circular lens aperture, resulting in dark peripheral corner margins.
    corners = [img[0:15, 0:15], img[0:15, w-15:w], img[h-15:h, 0:15], img[h-15:h, w-15:w]]
    corner_brightness = float(np.mean([np.mean(c) for c in corners]))

    cy, cx = h // 2, w // 2
    center = img[max(0, cy-20):min(h, cy+20), max(0, cx-20):min(w, cx+20)]
    center_brightness = float(np.mean(center)) if center.size > 0 else 50.0

    # If an image has brightly illuminated corners and lacks deep retinal redness (R/B < 2.5),
    # it is an ordinary flat room/portrait photo, not a fundus scan.
    if corner_brightness > 50 and corner_brightness > center_brightness * 0.7 and rb_ratio < 2.5:
        return {
            "valid": False,
            "error": "Invalid Retinal Image: Image lacks ophthalmic fundus camera aperture characteristics. Please upload a genuine retinal fundus photograph."
        }

    return {"valid": True}


def crop_black_borders(image: np.ndarray, threshold: int = 15) -> np.ndarray:
    """Remove unnecessary black borders from a retinal fundus image."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest)
        # Only crop if the detected region is reasonably large
        if w > image.shape[1] * 0.3 and h > image.shape[0] * 0.3:
            return image[y:y+h, x:x+w]
    return image


def enhance_contrast(image: np.ndarray) -> np.ndarray:
    """Apply CLAHE contrast enhancement to improve retinal vessel visibility."""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l_channel)
    enhanced = cv2.merge([l_enhanced, a, b])
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)


def preprocess_for_model(file_path: str, enhance: bool = True) -> np.ndarray:
    """
    Full preprocessing pipeline for model inference.
    Returns a normalized numpy array of shape (1, H, W, 3).
    """
    img = cv2.imread(file_path)
    if img is None:
        raise ValueError(f"Cannot read image: {file_path}")

    # Crop black borders
    img = crop_black_borders(img)

    # Resize
    img = cv2.resize(img, TARGET_SIZE, interpolation=cv2.INTER_AREA)

    # Optional contrast enhancement
    if enhance:
        img = enhance_contrast(img)

    # Convert BGR to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Normalize to [0, 1]
    img = img.astype(np.float32) / 255.0

    # Add batch dimension
    return np.expand_dims(img, axis=0)
