import os
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

ARTIFACT_PATH = Path(
    os.environ.get("MODEL_ARTIFACT", "ml/artifacts/loan_pipeline.joblib")
)

if not ARTIFACT_PATH.exists():
  raise RuntimeError(
      f"Model artifact not found at {ARTIFACT_PATH}. "
      "Run ml/train_model.py first."
  )

bundle: Dict[str, Any] = joblib.load(ARTIFACT_PATH)
pipeline = bundle["pipeline"]
metadata = bundle.get("metadata", {})

app = FastAPI(
    title="Loan Prediction Service",
    version="1.0.0",
    description="Inference API for Goldman loan orchestration prototype.",
)


class LoanFeatures(BaseModel):
  ApplicantIncome: Optional[float] = Field(None, ge=0)
  CoapplicantIncome: Optional[float] = Field(None, ge=0)
  LoanAmount: Optional[float] = Field(None, ge=0)
  Loan_Amount_Term: Optional[float] = Field(None, ge=0)
  Credit_History: Optional[float]
  Gender: Optional[str]
  Married: Optional[str]
  Dependents: Optional[str]
  Education: Optional[str]
  Self_Employed: Optional[str]
  Property_Area: Optional[str]
  Loan_Status: Optional[str] = None  # ignored


class PredictionResponse(BaseModel):
  score: float
  decision: str
  model: str = "xgboost_pipeline"
  metadata: Dict[str, Any]


def to_probability(raw_score: float) -> float:
  return max(0.0, min(1.0, raw_score))


def score_to_decision(score: float) -> str:
  if score >= 0.65:
    return "MODEL_APPROVE"
  if score >= 0.45:
    return "MODEL_REVIEW"
  return "MODEL_REJECT"


@app.post("/predict", response_model=PredictionResponse)
def predict(features: LoanFeatures):
  payload = features.dict(exclude_none=True)
  if not payload:
    raise HTTPException(status_code=400, detail="No features provided")
  df = PipelineInputAdapter.transform(payload)
  proba = None
  if hasattr(pipeline, "predict_proba"):
    proba = pipeline.predict_proba(df)[:, 1][0]
  else:
    proba = pipeline.predict(df)[0]
  score = to_probability(float(proba))
  decision = score_to_decision(score)
  return PredictionResponse(
      score=score,
      decision=decision,
      metadata={
          "uses_xgboost": metadata.get("uses_xgboost"),
          "has_predict_proba": metadata.get("has_predict_proba"),
      },
  )


class PipelineInputAdapter:
  @staticmethod
  def transform(payload: Dict[str, Any]):
    import pandas as pd
    return pd.DataFrame([payload])


if __name__ == "__main__":
  uvicorn.run(
      "ml.model_service:app",
      host="0.0.0.0",
      port=int(os.environ.get("PORT", 8000)),
      reload=False,
  )
