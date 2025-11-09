# HackUTDGoldie – Loan Orchestration Platform

This repo contains:

- **Node.js backend** (Express + PostgreSQL) with JWT auth, loan workflow, notifications, bank accounts, and model insights.
- **React/Vite frontend** styled with OnboardIQ colors.
- **ML toolkit** (`ml/train_model.py`, `ml/model_service.py`) to train/deploy the loan-prediction model used by the backend.

Below are the steps to run every layer locally.

---

## 1. Prerequisites

- Node.js 18+
- Python 3.9+ (with `venv`)
- PostgreSQL running locally (defaults: `postgres:Pra@1ful` at `localhost:5432`)
- Homebrew + `libomp` (macOS only, needed for XGBoost): `brew install libomp`

## 2. Install backend dependencies

```bash
cd /Users/prafullkumar/Desktop/Projects/HackUTDGoldie
npm install
```

## 3. Environment variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Set:

- `PG*` – Postgres connection
- `JWT_SECRET` – random string
- `MODEL_ENDPOINT` – set later after running the ML API (e.g., `http://localhost:8000/predict`)
- `MODEL_AUTO_REJECT` – `true/false`, auto-decline apps when the model verdict is `MODEL_REJECT`

## 4. Run the ML pipeline (optional but recommended)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt
python ml/train_model.py --data train.csv --artifacts ml/artifacts
uvicorn ml.model_service:app --host 0.0.0.0 --port 8000
```

Keep the FastAPI service running in a separate terminal and set:

```
MODEL_ENDPOINT=http://localhost:8000/predict
MODEL_AUTO_REJECT=true
```

## 5. Start PostgreSQL

Ensure Postgres is running and the configured DB (`PGDATABASE`) exists. If not:

```bash
createdb -U postgres postgres
```

## 6. Seed data (optional)

```bash
npm run seed
```

## 7. Run the backend

```bash
npm run dev
```

Server listens on `http://localhost:5003` (JWT-protected after login/register).

## 8. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Vite will launch at `http://localhost:5173`. The UI calls the backend (default base URL `http://localhost:5003`).

## 9. Login/Register flow

1. Visit `http://localhost:5173/register` and create a user (Admin/Vendor/Client).
2. The frontend stores `OnboardIQUser` + `OnboardIQToken` in `localStorage`.
3. All subsequent API requests carry the JWT automatically.

## 10. Loan submission walkthrough

1. Ensure a bank account exists via `Client` → “Bank Accounts” (form collects CIP data and is prefilling read-only email).
2. Navigate to “Loan Workspace”, fill income/debt/credit score, optionally attach the bank account. The form preloads name/email from the logged-in user.
3. When submitted:
   - Backend validates, syncs with ML service, stores `model_score` + `model_decision`.
   - Vendors/Admins see pending requests with stage status + model insight card.

## 11. Pending review & approvals

- Vendors click “Approve KYC/Compliance/Eligibility” sequentially or “Reject”.
- The model verdict card helps triage (green/amber/red with confidence bar).
- Notifications and logs track every action; Admins can see dashboards at `/dashboard`.

## 12. Common scripts

| Command                           | Description                            |
| --------------------------------- | -------------------------------------- |
| `npm run dev`                     | Backend with nodemon                   |
| `npm run seed`                    | Seed stocks + loan applications        |
| `cd frontend && npm run dev`      | Run frontend                           |
| `python ml/train_model.py`        | Train model + save artifact            |
| `uvicorn ml.model_service:app`    | Start FastAPI model service            |

## 13. Production notes

- Set real Postgres credentials & rotate `JWT_SECRET`.
- Deploy the FastAPI service (Docker, Render, etc.) and update `MODEL_ENDPOINT`.
- Use HTTPS + secure storage for `.env`.
- Frontend build: `cd frontend && npm run build`.
- Use the sidebar’s “Switch to light/dark mode” button to preview both themes (palette adapts automatically via CSS variables).
- Docker Compose is provided (`docker-compose.yml`) if you want containerized setup (update env accordingly).

---

Need help deploying or extending the workflow (more dashboards, better ML)? Reach out! This README has everything required to run all instances locally. ന
