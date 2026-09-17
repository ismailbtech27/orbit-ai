# Orbit AI - Agentic Cybersecurity Platform

Orbit AI is a full-stack cybersecurity platform combining **Machine Learning threat detection** with **Agentic AI** for threat analysis, risk assessment, and policy-guided response. It is designed to demonstrate an end-to-end security pipeline from event ingestion to automated mitigation.

## System Architecture

1. **Frontend (React + Vite)**: A dynamic dashboard for visualizing threats, risk scores, and agent decisions.
2. **Backend API (Node.js/Express)**: Orchestrates the pipeline. Handles rate-limiting, event ingestion, and coordinates the engines.
3. **Database (SQLite + Sequelize)**: Persists `User` states, `SecurityEvent` logs, generated `Alert`s, and `AuditLog`s.
4. **ML Service (Python + FastAPI)**: A microservice hosting a Scikit-Learn Logistic Regression model that classifies event sequences as benign or anomalous.
5. **Risk Engine (Node.js)**: Deterministically calculates a Risk Score (0-100) based on ML Confidence, Event Severity, and Asset Criticality.
6. **Agentic AI Layer (Gemini)**: Uses `@google/genai` to analyze the threat context and recommend an action, structured perfectly using JSON constraints.
7. **Policy Engine (Node.js)**: A deterministic module that evaluates the Agent's recommended action against strict organizational policies (e.g., preventing automated blocking on critical assets without human approval).

## How to Run

### Option 1: Docker Compose (Recommended)
You can spin up the entire application (Frontend, Backend, and ML Service) with one command. Ensure you have Docker installed.

1. Add your API Key: Open the `.env` file and insert `GEMINI_API_KEY=your_key`.
2. Run: `docker-compose up --build`
3. Access the Dashboard at: `http://localhost:5173`

### Option 2: Local Development
1. **Backend/Frontend**: 
   - `npm install`
   - `npm run dev:all` (Starts Vite on 5173 and Express on 3001)
2. **ML Service**: 
   - `python -m venv venv`
   - `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
   - `pip install -r ml_service/requirements.txt`
   - `uvicorn ml_service.main:app --reload --port 8000`

---

## Interview Q&A (Defense Guide)

**1. Why did you choose this ML algorithm?**
I synthesized a curated dataset mimicking login failures and unusual IP access. I evaluated both *Logistic Regression* and *Random Forest*. Both achieved an identical high F1-score (0.9756) on the synthetic data, but I selected *Logistic Regression* because its linear decision boundary is simpler, more transparent, and less prone to overfitting on straightforward tabular data.

**2. How does the model detect a threat?**
When the Node.js backend receives an event, it extracts 4 features (recent failed logins, unusual IP flag, time of day, sensitive file access). It sends these to the Python FastAPI service, which passes them through the serialized `.joblib` model to return a binary classification and a confidence percentage.

**3. What is the difference between ML detection and Agentic AI?**
- **ML Detection** is purely statistical. It looks at numbers (failed logins) and predicts a binary outcome (Threat/Benign) based on training data.
- **Agentic AI** uses a Large Language Model (Gemini) to reason about the *context*. It looks at the ML's prediction, the calculated Risk Score, and the Asset context, and uses semantic reasoning to *recommend a mitigation strategy* (e.g., "Restrict Account").

**4. How do you prevent the agent from taking unsafe actions?**
Two ways: 
1. **Prompt Constraints**: The Agent is forced via zero-shot prompting and JSON-schema constraints to strictly pick from a predefined array of `validActions`.
2. **The Policy Engine**: The Agent never executes an action directly. Its output is piped into a deterministic Policy Engine that evaluates the recommendation (e.g., if the AI suggests "Block" on a Risk Score of 40, the Policy Engine rejects it).

**5. How is risk calculated?**
It's a deterministic formula: `(Base Severity + (Base Severity * ML Confidence)) * Asset Criticality Multiplier`. This ensures that high-confidence threats on critical assets exponentially raise the score, capping at 100.

**6. What happens if the ML service or LLM fails?**
The backend uses try/catch blocks. If the ML service fails, the event is logged but no alert is generated. If the Gemini API fails, the `agentEngine` safely catches the error and defaults to a non-disruptive `INVESTIGATE` action, ensuring the pipeline doesn't crash.

**7. How do you audit security decisions?**
Every step of the pipeline—from event ingestion to the Policy Engine's final verdict—writes an immutable record to the `AuditLog` SQLite table.

## Tests
A unit test suite validates the deterministic engines. Run `node test_engines.js` to verify Risk and Policy engine constraints.
