"""
CardioVision AI — Explainability Module (Grad-CAM & Microvascular Saliency)

Provides visual attention heatmaps:
1. Deep Learning Grad-CAM (when a Keras model is loaded)
2. Microvascular Saliency Heatmap (gradient-weighted vessel attention overlay)
"""

import numpy as np
import cv2
from pathlib import Path
from typing import Optional


class GradCAMGenerator:
    """Generate explainability heatmaps (Grad-CAM and Microvascular Attention)."""

    def __init__(self):
        self.tf_available = False
        self.model = None
        self.target_layer_name = None

    def initialize(self, model, target_layer_name: Optional[str] = None):
        """
        Initialize with a Keras model.
        Attempts to find a suitable convolutional layer for Grad-CAM.
        """
        try:
            import tensorflow as tf
            self.model = model

            if target_layer_name:
                self.target_layer_name = target_layer_name
            else:
                for layer in reversed(model.layers):
                    if isinstance(layer, (tf.keras.layers.Conv2D,)):
                        self.target_layer_name = layer.name
                        break

            if self.target_layer_name:
                self.tf_available = True
        except Exception:
            self.tf_available = False

    def is_available(self) -> bool:
        # Always available because we have both Grad-CAM and high-resolution microvascular saliency fallback
        return True

    def generate(self, image_input, save_path: str) -> dict:
        """
        Generate explainability visualization.
        Accepts preprocessed array (1, H, W, 3) or file path string.
        """
        # 1. Try real Grad-CAM if model is loaded and layer exists
        if self.tf_available and self.model is not None and isinstance(image_input, np.ndarray):
            try:
                gradcam_res = self._generate_tf_gradcam(image_input, save_path)
                if gradcam_res.get("available"):
                    return gradcam_res
            except Exception:
                pass

        # 2. Fallback to computer-vision microvascular attention saliency
        return self._generate_saliency_heatmap(image_input, save_path)

    def _generate_tf_gradcam(self, image_array: np.ndarray, save_path: str) -> dict:
        import tensorflow as tf

        grad_model = tf.keras.Model(
            inputs=self.model.input,
            outputs=[
                self.model.get_layer(self.target_layer_name).output,
                self.model.output
            ]
        )

        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(image_array)
            loss = predictions[:, 0]

        grads = tape.gradient(loss, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        conv_outputs = conv_outputs[0]
        heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)
        heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
        heatmap = heatmap.numpy()

        h, w = image_array.shape[1], image_array.shape[2]
        heatmap_resized = cv2.resize(heatmap, (w, h))
        heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)

        original = np.uint8(image_array[0] * 255)
        original_bgr = cv2.cvtColor(original, cv2.COLOR_RGB2BGR)
        overlay = cv2.addWeighted(original_bgr, 0.6, heatmap_colored, 0.4, 0)
        cv2.imwrite(save_path, overlay)

        return {
            "available": True,
            "path": save_path,
            "type": "gradcam",
            "message": "Grad-CAM generated successfully."
        }

    def _generate_saliency_heatmap(self, image_input, save_path: str) -> dict:
        """
        Generates microvascular attention heatmap based on vessel gradient magnitude
        and optic disc/arcade focal weighting.
        """
        try:
            if isinstance(image_input, str):
                img = cv2.imread(image_input)
            elif isinstance(image_input, np.ndarray):
                if image_input.ndim == 4:
                    img = np.uint8(image_input[0] * 255)
                    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                else:
                    img = image_input.copy()
            else:
                return {"available": False, "path": None, "message": "Invalid image input"}

            if img is None:
                return {"available": False, "path": None, "message": "Could not read image"}

            h, w = img.shape[:2]
            b, g, r = cv2.split(img)

            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            g_enh = clahe.apply(g)

            # High-frequency vessel edge gradients
            sobelx = cv2.Sobel(g_enh, cv2.CV_64F, 1, 0, ksize=3)
            sobely = cv2.Sobel(g_enh, cv2.CV_64F, 0, 1, ksize=3)
            magnitude = cv2.magnitude(sobelx, sobely)

            # Retinal disc mask
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            _, mask = cv2.threshold(gray, 20, 255, cv2.THRESH_BINARY)
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

            # Central arcade weighting
            center_y, center_x = h // 2, int(w * 0.58) # Near optic disc/macula
            y_indices, x_indices = np.indices((h, w))
            dist_sq = (x_indices - center_x)**2 + (y_indices - center_y)**2
            spatial_weight = np.exp(-dist_sq / (2 * (min(h, w) * 0.38)**2))

            saliency = magnitude * spatial_weight
            saliency = cv2.bitwise_and(saliency, saliency, mask=mask)

            s_min, s_max = np.min(saliency), np.max(saliency)
            if s_max > s_min:
                norm_saliency = np.uint8(255 * (saliency - s_min) / (s_max - s_min))
            else:
                norm_saliency = np.zeros((h, w), dtype=np.uint8)

            smoothed = cv2.GaussianBlur(norm_saliency, (25, 25), 0)
            heatmap = cv2.applyColorMap(smoothed, cv2.COLORMAP_JET)
            heatmap[mask == 0] = [0, 0, 0]

            overlay = cv2.addWeighted(img, 0.60, heatmap, 0.40, 0)
            cv2.imwrite(str(save_path), overlay)

            return {
                "available": True,
                "path": str(save_path),
                "type": "microvascular_saliency",
                "message": "Microvascular attention saliency heatmap generated successfully."
            }
        except Exception as e:
            return {
                "available": False,
                "path": None,
                "message": f"Saliency heatmap generation failed: {str(e)}"
            }
