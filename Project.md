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
- PostgreSQL database with Node.js ORM/helpers
- Docker containerization

## 🏗️ System Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────────────────┐
│              Node.js / Express Application              │
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
│              Node.js Services & PostgreSQL DB           │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Backend**: Node.js 20 + Express 4
- **Database**: PostgreSQL (via pg)
- **Containerization**: Docker & Docker Compose
- **Message Queue**: Kafka (optional, infrastructure ready)
- **Additional Libraries**: 
  - cors for CORS handling
  - bcryptjs for password hashing
  - uuid for application IDs

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed (optional)
- Node.js 20+ and npm

### Using Docker

1. **Build and start the application**:
   ```bash
   docker compose up --build
   ```

2. **The application will be available at**:
   - API: `http://localhost:5003`
   - Health check: `http://localhost:5003/`

3. **Reseed sample data (optional)**:
   ```bash
   docker exec -it loan-backend npm run seed:loans
   ```

### Local Development

1. **Configure environment**:
   ```bash
   cp .env.example .env  # set PGHOST, PGUSER, etc.
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Seed baseline data**:
   ```bash
   npm run seed:stocks     # Load stock quotes from CSV
   node seedLoanData.js 50 # Generate 50 sample loan applications
   ```

4. **Run the Node server**:
   ```bash
   npm start
   ```

### Auto-Seeding (optional)

- Copy `.env.example` to `.env` and set your PostgreSQL credentials.
- Set `AUTO_SEED=true` if you want the server to seed stocks and `IN_MEMORY_LOAN_COUNT` (defaults to 25) loan applications automatically on startup.
- Example:
  ```bash
  AUTO_SEED=true npm start
  ```
  Disable `AUTO_SEED` for normal production usage.

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
curl http://localhost:5003/

# Submit application
curl -X POST http://localhost:5003/loan-application/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"+1234567890","region":"AMERICAS","country":"United States","income":80000,"debt":20000,"credit_score":720,"loan_amount":200000,"loan_purpose":"Home Purchase"}'

# View dashboard
curl http://localhost:5003/dashboard/overview
```

## 📁 Project Structure

```
.
├── server.js                   # Express application entry point
├── db.js                       # PostgreSQL connection & schema bootstrap
├── loanService.js              # Loan persistence helpers
├── verificationService.js      # Verification workflow logic
├── seedData.js                 # Stock data seeder
├── seedLoanData.js             # Sample loan generator
├── start.sh                    # Helper script (seed + start server)
├── package.json                # Backend dependencies & scripts
├── docker-compose.yml          # Multi-container setup
├── Dockerfile                  # Backend container image
├── frontend/                   # React application
└── API_DOCUMENTATION.md        # Detailed API docs
```

## ⚙️ Configuration

**Verification Rules** (in `verificationService.js`):
- `MAX_DTI_RATIO = 0.4`
- `MIN_CREDIT_SCORE = 650`
- `INCOME_TO_LOAN_RATIO = 3`
- `MAX_LOAN_AMOUNT = 1_000_000`
- `MIN_INCOME = 30_000`

**Generate Sample Data**:
```bash
npm run seed:stocks     # load stocks.csv
node seedLoanData.js 50 # create and process 50 apps
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

**Built with ❤️ using Node.js, PostgreSQL, and Docker**
