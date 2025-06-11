#!/usr/bin/env bash
set -euo pipefail

MODEL_DIR="frontend/models"
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

mkdir -p "$MODEL_DIR"

files=(
  "age_gender_model-shard1"
  "age_gender_model-weights_manifest.json"
  "face_expression_model-shard1"
  "face_expression_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_tiny_model-shard1"
  "face_landmark_68_tiny_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
  "face_recognition_model-weights_manifest.json"
  "mtcnn_model-shard1"
  "mtcnn_model-weights_manifest.json"
  "ssd_mobilenetv1_model-shard1"
  "ssd_mobilenetv1_model-shard2"
  "ssd_mobilenetv1_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "tiny_face_detector_model-weights_manifest.json"
)

for file in "${files[@]}"; do
  echo "Downloading $file"
  curl -L "$BASE_URL/$file" -o "$MODEL_DIR/$file"
done

printf '\nAll models downloaded to %s\n' "$MODEL_DIR"
