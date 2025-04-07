# Stage 1: Node builder for React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Python Builder
FROM python:3.11.9-bookworm AS backend-builder

# Set environment variables to prevent Python from writing .pyc files and buffering
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --user -q -r requirements.txt

# Stage 3: Runtime
FROM python:3.11.9-slim-bookworm

# Set the working directory
WORKDIR /app

# Copy installed packages from Python builder
COPY --from=backend-builder /root/.local /root/.local

# Copy the built frontend from the Node builder
COPY --from=frontend-builder /app/dist /app/client/dist

# Copy the application code
COPY server/ ./server/

# Update PATH environment variable
ENV PATH=/root/.local/bin:$PATH
ENV PORT=8080

# Command to run the application
CMD cd server && gunicorn --bind 0.0.0.0:$PORT app:app