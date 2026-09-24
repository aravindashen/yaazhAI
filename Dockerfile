# Multi-stage Dockerfile for YAAZH AI Classical Tamil Knowledge Platform
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Python Backend & Production Runtime
FROM python:3.11-slim
WORKDIR /app

# Install Tesseract OCR and Tamil language pack
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-tam \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and frontend build
COPY backend /app/backend
COPY --from=frontend-builder /app/dist /app/dist

ENV PORT=8000
ENV HOST=0.0.0.0
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
