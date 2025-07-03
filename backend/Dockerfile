FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make scripts executable
RUN chmod +x startup.sh && chmod +x scripts/*.py

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

# Create generated directory and set permissions
RUN mkdir -p /app/app/generated && chown -R app:app /app

# Switch to non-root user
USER app

# Clean up any existing generated files and ensure proper permissions
RUN rm -rf /app/app/generated/* || true

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start the application using the startup script
CMD ["./startup.sh"] 