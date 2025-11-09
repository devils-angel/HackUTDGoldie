## Loan Prediction Service

This folder contains everything required to train and deploy the loan-prediction model that powers `MODEL_ENDPOINT`.

### 1. Train locally

```bash
cd /path/to/HackUTDGoldie
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt
python ml/train_model.py --data train.csv --artifacts ml/artifacts
```

Outputs:

- `ml/artifacts/loan_pipeline.joblib` – serialized preprocessing + model pipeline
- `ml/artifacts/loan_pipeline_metrics.json` – classification report for reference

### 2. Run inference API locally

```bash
source .venv/bin/activate  # if not already
uvicorn ml.model_service:app --host 0.0.0.0 --port 8000
```

Send a sample request:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"ApplicantIncome":5000,"CoapplicantIncome":0,"LoanAmount":128,"Loan_Amount_Term":360,"Credit_History":1,"Gender":"Male","Married":"Yes","Dependents":"0","Education":"Graduate","Self_Employed":"No","Property_Area":"Urban"}'
```

### 3. Connect Node backend

Set the FastAPI URL in `.env`:

```
MODEL_ENDPOINT=http://localhost:8000/predict
```

Restart `npm run dev`. New loan submissions will call this endpoint and store `model_score` + `model_decision`.

### 4. Deploy (optional)

- Containerize `ml/model_service.py` or deploy to Render/Railway/Fly.io.
- Update `MODEL_ENDPOINT` to the public URL.
- Consider securing the endpoint with an API key and forward it via `MODEL_ENDPOINT_AUTH_HEADER` (extend backend if needed).
