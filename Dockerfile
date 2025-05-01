# Base image for both dev and prod
FROM python:3.11-slim AS base

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Development stage
FROM base AS development
COPY ./src/backend /app
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]

# Production stage
FROM base AS production
RUN pip install gunicorn
COPY ./src/backend /app
COPY ./src/frontend/static /app/static
COPY ./src/frontend/templates /app/templates
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]