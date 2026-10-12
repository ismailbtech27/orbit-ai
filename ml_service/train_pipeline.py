import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

print("--- Orbit AI ML Pipeline (Sequence & Stage Prediction) ---")

# 1. Synthesize Dataset
# We create a dataset mapping sequence features to a specific attack stage.
# Features:
# - failed_logins: Count of failed logins in the sequence
# - successful_logins: Count of successful logins in the sequence
# - sensitive_access: Count of sensitive file access events
# - privilege_activity: Count of privilege/admin events
# - sequence_length: Total number of events in the sequence

# Target (predicted_stage):
# - 'Monitoring' (Benign)
# - 'Authentication Anomaly' (Repeated failed logins)
# - 'Account Compromise' (Failures followed by success)
# - 'Data Collection' (Sensitive access)
# - 'Privilege Escalation' (Admin/Privilege activity)

np.random.seed(42)
n_samples = 3000

# Helper to generate rows
def generate_samples(n, failed_logins, successful_logins, sensitive_access, privilege_activity, seq_len, stage):
    return pd.DataFrame({
        'failed_logins': np.random.poisson(lam=failed_logins, size=n),
        'successful_logins': np.random.poisson(lam=successful_logins, size=n),
        'sensitive_access': np.random.poisson(lam=sensitive_access, size=n),
        'privilege_activity': np.random.poisson(lam=privilege_activity, size=n),
        'sequence_length': np.random.poisson(lam=seq_len, size=n),
        'predicted_stage': stage
    })

print("Generating synthetic cybersecurity sequence dataset...")
data = [
    # Benign / Monitoring
    generate_samples(1000, failed_logins=0.2, successful_logins=1.0, sensitive_access=0.1, privilege_activity=0, seq_len=2, stage='Monitoring'),
    # Authentication Anomaly (Brute Force)
    generate_samples(500, failed_logins=5.0, successful_logins=0.0, sensitive_access=0.0, privilege_activity=0, seq_len=5, stage='Authentication Anomaly'),
    # Account Compromise (Brute force followed by success)
    generate_samples(500, failed_logins=4.0, successful_logins=1.0, sensitive_access=0.0, privilege_activity=0, seq_len=6, stage='Account Compromise'),
    # Data Collection (Accessing sensitive files)
    generate_samples(500, failed_logins=0.5, successful_logins=1.0, sensitive_access=3.0, privilege_activity=0, seq_len=4, stage='Data Collection'),
    # Privilege Escalation (Admin access attempts)
    generate_samples(500, failed_logins=0.0, successful_logins=1.0, sensitive_access=1.0, privilege_activity=2.0, seq_len=4, stage='Privilege Escalation')
]

df = pd.concat(data).sample(frac=1, random_state=42).reset_index(drop=True)
# Ensure no negative values from poisson
numeric_cols = df.select_dtypes(include=[np.number]).columns
df[numeric_cols] = df[numeric_cols].clip(lower=0)

print(f"Dataset generated with {len(df)} samples.")
print(df['predicted_stage'].value_counts())

# 2. Preprocessing & Train/Test Split
X = df.drop('predicted_stage', axis=1)
y = df['predicted_stage']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print("Data split into train and test sets.")

# 3. Model Training
print("\nTraining Random Forest Classifier for Sequence Prediction...")
rf = RandomForestClassifier(n_estimators=100, max_depth=8, class_weight='balanced', random_state=42)
rf.fit(X_train, y_train)
y_pred = rf.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
print(f"Random Forest Accuracy: {accuracy:.4f}")

print("\n--- Final Model Evaluation ---")
print(classification_report(y_test, y_pred))

# 4. Model Serialization
os.makedirs('model', exist_ok=True)
model_path = 'model/threat_model.joblib'
joblib.dump(rf, model_path)
print(f"Sequence model saved successfully to {model_path}.")
