# 🏦 Loan Application Management System

A comprehensive end-to-end loan application processing system with automated KYC verification, legal compliance checks, loan eligibility assessment, and dashboard analytics.

## 📋 Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Workflow Overview](#workflow-overview)
- [API Documentation](#api-documentation)
- [Dashboard Analytics](#dashboard-analytics)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Future Enhancements](#future-enhancements)

## ✨ Features

### Core Functionality

- **Complete Loan Application Workflow**: End-to-end processing from submission to final decision
- **Multi-Stage Verification**:
  - ✅ KYC (Know Your Customer) Verification
  - ✅ Legal Compliance Checks
  - ✅ Loan Eligibility Assessment
- **Automated Decision Making**: Based on configurable business rules
- **Notification System**: Email and alert notifications (simulated in POC)
- **Dashboard Analytics**: Comprehensive analytics and reporting

### Dashboard Features

- Regional distribution (APAC, EMEA, AMERICAS, MEA)
- Country-wise application breakdown
- Verification stage statistics
- Financial metrics and trends
- Timeline analysis

### Additional Features

- User registration and authentication
- Stock market data integration (existing functionality maintained)
- RESTful API with CORS support
- SQLite database with SQLAlchemy ORM
- Docker containerization

## 🏗️ System Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────────────────┐
│              Flask Application (REST API)               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    User      │  │    Loan      │  │  Dashboard   │ │
│  │ Management   │  │ Application  │  │  Analytics   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│           Verification Service (Business Logic)         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐       │
│  │   KYC    │→ │ Compliance │→ │ Eligibility  │       │
│  │  Check   │  │   Check    │  │    Check     │       │
│  └──────────┘  └────────────┘  └──────────────┘       │
│                         ↓                               │
│                  ┌─────────────┐                        │
│                  │   Final     │                        │
│                  │  Decision   │                        │
│                  └─────────────┘                        │
│                         ↓                               │
│                  ┌─────────────┐                        │
│                  │Notification │                        │
│                  └─────────────┘                        │
├─────────────────────────────────────────────────────────┤
│              SQLAlchemy ORM & SQLite DB                 │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Backend**: Flask 3.0.3, Python 3.11
- **Database**: SQLite with SQLAlchemy ORM
- **Containerization**: Docker & Docker Compose
- **Message Queue**: Kafka (optional, infrastructure ready)
- **Additional Libraries**: 
  - Flask-CORS for cross-origin requests
  - Werkzeug for password hashing
  - Pandas for data processing

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Build and start the application**:
   ```bash
   docker-compose up --build
   ```

2. **The application will be available at**:
   - API: `http://localhost:5000`
   - Health check: `http://localhost:5000/`

3. **Generate sample data** (optional):
   ```bash
   docker exec -it flask-app python generate_sample_data.py
   ```

### Local Development

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application**:
   ```bash
   python seed_data.py  # Load stock data
   python app.py        # Start Flask server
   ```

3. **Generate sample data**:
   ```bash
   python generate_sample_data.py
   ```

## 📊 Workflow Overview

### Loan Application Process

The system processes each application through the following stages:

1. **KYC Verification** → 2. **Compliance Check** → 3. **Eligibility Assessment** → 4. **Final Decision** → 5. **Notification**

Each stage can result in APPROVED or REJECTED status. If any stage is rejected, the entire application is rejected.

### Verification Criteria

**KYC Verification:**
- Email format validation
- Phone number validation (≥10 digits)
- Document upload verification
- Name validation (≥3 characters)
- Region/country validation

**Legal Compliance:**
- Political connections screening
- Senior employee relative detection
- Sanctions list screening
- High-risk country assessment
- High-value transaction flagging (>$500K)

**Loan Eligibility:**
- Debt-to-Income ratio < 40%
- Credit Score ≥ 650
- Income ≥ 3x loan amount
- Maximum loan: $1,000,000
- Minimum income: $30,000

## 📖 API Documentation

### Key Endpoints

**Submit Loan Application:**
```bash
POST /loan-application/submit
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "region": "AMERICAS",
  "country": "United States",
  "income": 85000,
  "debt": 25000,
  "credit_score": 720,
  "loan_amount": 250000,
  "loan_purpose": "Home Purchase"
}
```

**Check Status:**
```bash
GET /loan-application/status/{application_id}
```

**Dashboard Analytics:**
```bash
GET /dashboard/overview
GET /dashboard/by-region
GET /dashboard/by-country
GET /dashboard/verification-stats
GET /dashboard/financial-metrics
GET /dashboard/timeline?days=30
```

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 📊 Dashboard Analytics

The system provides comprehensive analytics:

- **Overview**: Total applications, approval/rejection rates
- **Regional Distribution**: Applications by APAC, EMEA, AMERICAS, MEA
- **Country Analysis**: Country-wise breakdown with approval rates
- **Verification Funnel**: Pass rates at each verification stage
- **Financial Metrics**: Average credit scores, DTI ratios, loan amounts
- **Timeline Trends**: Application volume and approval trends over time

## 🧪 Testing

**Run the automated test suite:**
```bash
python test_api.py
```

**Manual testing examples:**
```bash
# Health check
curl http://localhost:5000/

# Submit application
curl -X POST http://localhost:5000/loan-application/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"+1234567890","region":"AMERICAS","country":"United States","income":80000,"debt":20000,"credit_score":720,"loan_amount":200000,"loan_purpose":"Home Purchase"}'

# View dashboard
curl http://localhost:5000/dashboard/overview
```

## 📁 Project Structure

```
.
├── app.py                      # Main Flask application
├── models.py                   # Database models
├── verification_service.py     # Verification logic
├── generate_sample_data.py     # Sample data generator
├── test_api.py                 # API test suite
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker image
├── docker-compose.yml          # Multi-container setup
├── README.md                   # This file
└── API_DOCUMENTATION.md        # Detailed API docs
```

## ⚙️ Configuration

**Verification Rules** (in `verification_service.py`):
```python
MAX_DTI_RATIO = 0.4         # 40%
MIN_CREDIT_SCORE = 650
INCOME_TO_LOAN_RATIO = 3
MAX_LOAN_AMOUNT = 1000000
MIN_INCOME = 30000
```

**Generate Sample Data**:
```python
generate_sample_applications(count=50)
```

## 🔮 Future Enhancements

### High Priority
- Asynchronous processing with Kafka/Celery
- Real email integration
- Document upload and OCR
- Real-time dashboard with WebSockets

### Medium Priority
- Admin panel for manual review
- External credit bureau integration
- Multi-factor authentication
- Role-based access control

### Nice to Have
- Machine learning for fraud detection
- Mobile app
- GraphQL API
- Blockchain audit trail

## 📝 Production Recommendations

1. **Database**: Migrate to PostgreSQL
2. **Caching**: Add Redis
3. **Queue**: Use Kafka/RabbitMQ
4. **Monitoring**: Implement APM
5. **Security**: Add authentication, rate limiting
6. **Scalability**: Deploy with Kubernetes

## 👥 Entities

- **Client**: Applies for loan
- **Vendor**: (Future) Views and processes applications
- **System**: Automated verification engine

---

**Built with ❤️ using Flask, Python, and Docker**