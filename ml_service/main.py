from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import joblib
import pandas as pd
import os

app = FastAPI(title="Orbit AI ML Detection Service")

# Load the trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "threat_model.joblib")

try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    print(f"Warning: Could not load model from {MODEL_PATH}. Error: {e}")
    model = None

# Input schemas
class SecurityEvent(BaseModel):
    eventType: str
    username: Optional[str] = None
    sourceIp: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None

class SequenceInput(BaseModel):
    events: List[SecurityEvent]

class PredictionOutput(BaseModel):
    is_threat: bool
    threat_type: str
    severity: str
    confidence: float
    current_stage: str
    predicted_stage: str
    model_used: str
    engine: str

@app.post("/predict_sequence", response_model=PredictionOutput)
def predict_sequence(input_data: SequenceInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Please train the model first.")
        
    events = input_data.events
    
    if not events:
        return PredictionOutput(
            is_threat=False,
            threat_type="None",
            severity="LOW",
            confidence=100.0,
            current_stage="Monitoring",
            predicted_stage="Monitoring",
            model_used=type(model).__name__,
            engine="ml"
        )
    
    # Feature Extraction
    failed_logins = sum(1 for e in events if e.eventType == "LOGIN_FAILED")
    successful_logins = sum(1 for e in events if e.eventType == "LOGIN_SUCCESS")
    sensitive_access = sum(1 for e in events if e.eventType == "SENSITIVE_FILE_ACCESS")
    privilege_activity = sum(1 for e in events if "ADMIN" in e.eventType or "PRIVILEGE" in e.eventType)
    seq_len = len(events)
    
    features = pd.DataFrame([{
        'failed_logins': failed_logins,
        'successful_logins': successful_logins,
        'sensitive_access': sensitive_access,
        'privilege_activity': privilege_activity,
        'sequence_length': seq_len
    }])
    
    # Predict next stage
    predicted_stage = model.predict(features)[0]
    
    # Confidence calculation
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(features)[0]
        confidence = float(max(probabilities)) * 100
    else:
        confidence = 100.0
        
    # Mapping logic for threat type and severity based on stage
    is_threat = predicted_stage != 'Monitoring'
    
    threat_type = "Suspicious Activity"
    severity = "LOW"
    current_stage = "Monitoring"
    
    if predicted_stage == 'Authentication Anomaly':
        threat_type = "Repeated Authentication Failures"
        severity = "MEDIUM"
        current_stage = "Authentication Anomaly"
    elif predicted_stage == 'Account Compromise':
        threat_type = "Suspicious Account Activity"
        severity = "HIGH"
        current_stage = "Authentication Anomaly"
    elif predicted_stage == 'Data Collection':
        threat_type = "Suspicious Account Activity"
        severity = "HIGH"
        current_stage = "Sensitive Data Access"
    elif predicted_stage == 'Privilege Escalation':
        threat_type = "Unauthorized Privileged Access Attempt"
        severity = "CRITICAL"
        current_stage = "Admin Access Attempt"
        
    return PredictionOutput(
        is_threat=is_threat,
        threat_type=threat_type,
        severity=severity,
        confidence=round(confidence, 2),
        current_stage=current_stage,
        predicted_stage=predicted_stage,
        model_used=type(model).__name__,
        engine="ml"
    )

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": model is not None, "engine": "ml"}
