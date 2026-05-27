# ---------- build frontend ----------
FROM node:22-alpine AS web

WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --no-audit --no-fund
COPY frontend ./
RUN npm run build

# ---------- runtime ----------
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend ./backend
COPY --from=web /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/backend/data
VOLUME ["/app/backend/data"]

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
