# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /app

# --- FIX ---
# Install system dependencies and build tools required for compiling Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y libsndfile1

# Install Python packages
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app/

# Expose the port
EXPOSE 8000