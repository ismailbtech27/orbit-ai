from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
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

class SecurityEventInput(BaseModel):
    recent_failed_logins: int
    unusual_ip_flag: int
    event_hour: int
    sensitive_file_access: int

class PredictionOutput(BaseModel):
    is_threat: bool
    confidence: float
    model_used: str

@app.post("/predict", response_model=PredictionOutput)
def predict_threat(event: SecurityEventInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Please train the model first.")
        
    # Convert input to DataFrame for the model
    input_data = pd.DataFrame([{
        "recent_failed_logins": event.recent_failed_logins,
        "unusual_ip_flag": event.unusual_ip_flag,
        "event_hour": event.event_hour,
        "sensitive_file_access": event.sensitive_file_access
    }])
    
    # Predict
    prediction = model.predict(input_data)[0]
    
    # Get probabilities
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(input_data)[0]
        # Confidence is the probability of the predicted class
        confidence = probabilities[1] if prediction == 1 else probabilities[0]
        confidence_percentage = round(float(confidence) * 100, 2)
    else:
        # Fallback if model doesn't support predict_proba
        confidence_percentage = 100.0 if prediction == 1 else 100.0
        
    return PredictionOutput(
        is_threat=bool(prediction == 1),
        confidence=confidence_percentage,
        model_used=type(model).__name__
    )

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": model is not None}
