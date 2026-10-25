# ---------------------------------------------------------------------------
# Reservation service - port 8085
# Build context: kamal/reservation
#   docker build -t kamal-reservation-service ./kamal/reservation
# ---------------------------------------------------------------------------
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
# gunicorn is the container WSGI server; it is not needed for local runs,
# which use `python index.py` (see kamal/README.md section 5.4).
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

# The process never runs as root.
RUN useradd --system --create-home --uid 10001 appuser && chown -R appuser:appuser /app
USER appuser

ENV PORT=8085 \
    HOME=/home/appuser
EXPOSE 8085

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD python -c "import os,sys,urllib.request;sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:'+os.getenv('PORT','8085')+'/health',timeout=2).status==200 else 1)"

CMD ["gunicorn", "--bind", "0.0.0.0:8085", "--workers", "2", "--access-logfile", "-", "index:app"]
