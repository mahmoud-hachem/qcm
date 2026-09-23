FROM node:22-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build

FROM python:3.13-slim
WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
COPY backend/ /app/backend/
COPY --from=frontend-builder /app/frontend/dist/ /app/frontend/dist/
ENV SERVE_FRONTEND=1
CMD ["sh", "-c", "exec uvicorn main:app --app-dir backend --host 0.0.0.0 --port ${PORT:-8000}"]
