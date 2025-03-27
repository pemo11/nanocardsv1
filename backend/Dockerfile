FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /app/

# Umgebungsvariable für Firebase-Konfiguration (optional)
# ENV GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-key.json

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]