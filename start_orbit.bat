@echo off
echo ===================================================
echo Starting Orbit AI System...
echo ===================================================

echo Starting Node.js Backend and React Frontend...
start "Orbit AI Web & Node Server" cmd /k "npm run dev:all"

echo Starting Python ML Pipeline and FastAPI Service...
start "Orbit AI ML Service" cmd /k "cd ml_service && pip install -r requirements.txt && python train_pipeline.py && uvicorn main:app --host 0.0.0.0 --port 8000"

echo.
echo All services are starting up in separate windows!
echo - React Frontend (Demo App & SOC Console): http://localhost:5173
echo - FastAPI ML Service: http://localhost:8000
echo ===================================================
pause
