FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Make sure the model exists or script is run to train it before starting
CMD ["python", "train_pipeline.py"] && uvicorn main:app --host 0.0.0.0 --port 8000
