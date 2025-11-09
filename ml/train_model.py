import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

try:
  from xgboost import XGBClassifier
  HAS_XGB = True
except ImportError:  # pragma: no cover - fallback if xgboost missing
  from sklearn.ensemble import GradientBoostingClassifier as XGBClassifier  # type: ignore
  HAS_XGB = False


def load_data(csv_path: Path) -> pd.DataFrame:
  if not csv_path.exists():
    raise FileNotFoundError(f"Dataset not found at {csv_path}")
  df = pd.read_csv(csv_path)
  if "Loan_ID" in df.columns:
    df = df.drop(columns=["Loan_ID"])
  return df


def build_pipeline(categorical_cols, numeric_cols) -> Pipeline:
  cat_pipeline = Pipeline(
    steps=[
      ("imputer", SimpleImputer(strategy="most_frequent")),
      ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ]
  )

  num_pipeline = Pipeline(
    steps=[
      ("imputer", SimpleImputer(strategy="median")),
      ("scaler", StandardScaler()),
    ]
  )

  preprocessor = ColumnTransformer(
    transformers=[
      ("categorical", cat_pipeline, categorical_cols),
      ("numeric", num_pipeline, numeric_cols),
    ]
  )

  model = XGBClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=4,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="logloss",
    random_state=42,
  )

  pipeline = Pipeline(
    steps=[
      ("preprocessor", preprocessor),
      ("model", model),
    ]
  )
  return pipeline


def main(dataset: Path, artifact_dir: Path):
  df = load_data(dataset)

  target_col = "Loan_Status"
  if target_col not in df.columns:
    raise ValueError(f"Column '{target_col}' missing from dataset.")

  y_raw = df[target_col]
  X = df.drop(columns=[target_col])
  if y_raw.dtype == "object":
    y = y_raw.map({"Y": 1, "N": 0})
    if y.isnull().any():
      raise ValueError("Unexpected labels in target column; expected 'Y'/'N'.")
    y = y.astype(int)
  else:
    y = y_raw.astype(int)

  categorical_cols = X.select_dtypes(include=["object"]).columns.tolist()
  numeric_cols = X.select_dtypes(include=["number"]).columns.tolist()

  pipeline = build_pipeline(categorical_cols, numeric_cols)

  X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
  )

  pipeline.fit(X_train, y_train)
  y_pred = pipeline.predict(X_test)
  y_prob = pipeline.predict_proba(X_test)[:, 1] if hasattr(pipeline, "predict_proba") else None

  report = classification_report(y_test, y_pred, output_dict=True)
  artifact_dir.mkdir(parents=True, exist_ok=True)
  artifact_path = artifact_dir / "loan_pipeline.joblib"
  joblib.dump(
    {
      "pipeline": pipeline,
      "metadata": {
        "categorical_cols": categorical_cols,
        "numeric_cols": numeric_cols,
        "report": report,
        "has_predict_proba": bool(y_prob is not None),
        "uses_xgboost": HAS_XGB,
      },
    },
    artifact_path,
  )

  metrics_path = artifact_dir / "loan_pipeline_metrics.json"
  with metrics_path.open("w", encoding="utf-8") as fh:
    json.dump(report, fh, indent=2)

  print(f"Model saved to {artifact_path}")
  print(f"Evaluation report saved to {metrics_path}")


if __name__ == "__main__":
  parser = argparse.ArgumentParser(description="Train loan prediction model.")
  parser.add_argument(
    "--data",
    type=str,
    default="train.csv",
    help="Path to training CSV (default: train.csv)",
  )
  parser.add_argument(
    "--artifacts",
    type=str,
    default="ml/artifacts",
    help="Directory to store model artifacts",
  )
  args = parser.parse_args()
  main(Path(args.data), Path(args.artifacts))
