import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, f1_score, accuracy_score
import joblib
import os

print("--- Orbit AI ML Pipeline ---")

# 1. Synthesize Dataset
# We create a curated dataset representing account and file access events.
# Features:
# - recent_failed_logins: Count of failed logins in the last hour.
# - unusual_ip_flag: 1 if the IP has never been seen for this user, 0 otherwise.
# - event_hour: Hour of the day (0-23).
# - sensitive_file_access: 1 if accessing a sensitive file, 0 otherwise.
# Target:
# - is_threat: 1 if it's a threat (Brute Force / Account Compromise / Insider Threat), 0 if benign.

print("Generating synthetic cybersecurity dataset...")
np.random.seed(42)
n_samples = 2000

# Generate benign data (class 0)
benign_samples = int(n_samples * 0.85)
benign_data = pd.DataFrame({
    'recent_failed_logins': np.random.poisson(lam=0.5, size=benign_samples),
    'unusual_ip_flag': np.random.choice([0, 1], p=[0.95, 0.05], size=benign_samples),
    'event_hour': np.random.randint(6, 22, size=benign_samples), # Mostly working hours
    'sensitive_file_access': np.random.choice([0, 1], p=[0.9, 0.1], size=benign_samples),
    'is_threat': 0
})

# Generate threat data (class 1)
# Threats typically have high failed logins (Brute force) or unusual IPs accessing sensitive files
threat_samples = n_samples - benign_samples
threat_data = pd.DataFrame({
    'recent_failed_logins': np.random.poisson(lam=5.0, size=threat_samples),
    'unusual_ip_flag': np.random.choice([0, 1], p=[0.2, 0.8], size=threat_samples),
    'event_hour': np.random.randint(0, 24, size=threat_samples), # Anytime
    'sensitive_file_access': np.random.choice([0, 1], p=[0.3, 0.7], size=threat_samples),
    'is_threat': 1
})

df = pd.concat([benign_data, threat_data]).sample(frac=1, random_state=42).reset_index(drop=True)
print(f"Dataset generated with {len(df)} samples.")
print(df['is_threat'].value_counts())

# 2. Preprocessing & Train/Test Split
X = df.drop('is_threat', axis=1)
y = df['is_threat']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print("Data split into train and test sets.")

# 3. Model Evaluation & Selection
# Cybersecurity detection often involves non-linear relationships (e.g. high failed logins + unusual IP).
# We evaluate Logistic Regression (linear) vs Random Forest (non-linear, robust).
print("\nEvaluating Models...")

# Model A: Logistic Regression
lr = LogisticRegression(class_weight='balanced', random_state=42)
lr.fit(X_train, y_train)
lr_preds = lr.predict(X_test)
lr_f1 = f1_score(y_test, lr_preds)
print(f"Logistic Regression F1-Score: {lr_f1:.4f}")

# Model B: Random Forest Classifier
rf = RandomForestClassifier(n_estimators=100, max_depth=5, class_weight='balanced', random_state=42)
rf.fit(X_train, y_train)
rf_preds = rf.predict(X_test)
rf_f1 = f1_score(y_test, rf_preds)
print(f"Random Forest F1-Score: {rf_f1:.4f}")

# Select the best model
if rf_f1 > lr_f1:
    print("\nDecision: Selected Random Forest Classifier.")
    print("Reasoning: It outperforms Logistic Regression in capturing non-linear interactions between features (e.g., conditional logic like 'IF failed logins > X AND IP is unusual'), which is typical in cybersecurity logs.")
    best_model = rf
    y_pred = rf_preds
else:
    print("\nDecision: Selected Logistic Regression.")
    print("Reasoning: It performed better or equal while providing a simpler, purely linear decision boundary.")
    best_model = lr
    y_pred = lr_preds

print("\n--- Final Model Evaluation ---")
print(classification_report(y_test, y_pred, target_names=['Benign (0)', 'Threat (1)']))

# 4. Model Serialization
os.makedirs('ml_service/model', exist_ok=True)
model_path = 'ml_service/model/threat_model.joblib'
joblib.dump(best_model, model_path)
print(f"Model saved successfully to {model_path}.")
