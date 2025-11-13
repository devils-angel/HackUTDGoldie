# Loan Application Management System - API Documentation

## Overview

This system provides a complete end-to-end loan application workflow with KYC verification, legal compliance checks, loan eligibility assessment, and dashboard analytics.

## System Architecture

The application processes loan applications through multiple verification stages:

1. **KYC Verification** - Validates identity, email, phone, and documents
2. **Legal Compliance Check** - Screens for political connections, senior employee relatives, and sanctions
3. **Loan Eligibility Assessment** - Evaluates credit score, debt-to-income ratio, and income sufficiency
4. **Final Decision** - Approves or rejects based on all verification stages
5. **Notification** - Sends alerts and emails to applicants

## Database Schema

### LoanApplication Table

Each row represents one client's loan application with the following key columns:

- **Basic Information**: name, email, phone, region, country
- **Financial Data**: income, debt, credit_score, loan_amount, loan_purpose, dti_ratio
- **KYC Status**: kyc_status, kyc_verified_at, kyc_remarks
- **Compliance Status**: compliance_status, compliance_verified_at, compliance_remarks, political_connection, senior_relative
- **Eligibility Status**: eligibility_status, eligibility_verified_at, eligibility_remarks
- **Final Status**: final_status, final_decision_at, final_remarks
- **Notifications**: alert_sent, email_sent

Status values: `PENDING`, `APPROVED`, `REJECTED`

## API Endpoints

### 1. Original Routes (Maintained for Backward Compatibility)

#### GET /
Health check endpoint
```bash
curl http://localhost:5003/
```

#### POST /register
Register a new user
```bash
curl -X POST http://localhost:5003/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure123"
  }'
```

#### POST /login
User login
```bash
curl -X POST http://localhost:5003/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123"
  }'
```

#### GET /data
Get stock market data
```bash
curl http://localhost:5003/data
```

#### POST /loan
Simple loan eligibility check (original functionality)
```bash
curl -X POST http://localhost:5003/loan \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "income": 75000,
    "debt": 25000,
    "credit_score": 720
  }'
```

### 2. Loan Application Routes

#### POST /loan-application/submit
Submit a new loan application with complete verification workflow

**Request Body:**
```json
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
  "loan_purpose": "Home Purchase",
  "documents_uploaded": true,
  "documents": ["ID_Proof", "Income_Statement", "Address_Proof"]
}
```

**Valid Regions:** APAC, EMEA, AMERICAS, MEA, NA, SA, EU, ASIA

**Example:**
```bash
curl -X POST http://localhost:5003/loan-application/submit \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Response:**
```json
{
  "message": "Loan application submitted and processed successfully",
  "application": {
    "application_id": "LOAN-20241108-ABC12345",
    "name": "John Doe",
    "kyc_status": "APPROVED",
    "compliance_status": "APPROVED",
    "eligibility_status": "APPROVED",
    "final_status": "APPROVED",
    "dti_ratio": 0.294,
    ...
  }
}
```

#### GET /loan-application/status/<application_id>
Get status of a specific application

**Example:**
```bash
curl http://localhost:5003/loan-application/status/LOAN-20241108-ABC12345
```

#### GET /loan-application/list
List all loan applications with optional filtering

**Query Parameters:**
- `status`: Filter by final status (PENDING, APPROVED, REJECTED)
- `region`: Filter by region (APAC, EMEA, AMERICAS, MEA)
- `limit`: Maximum number of results (default: 100)

**Examples:**
```bash
# Get all applications
curl http://localhost:5003/loan-application/list

# Get approved applications only
curl http://localhost:5003/loan-application/list?status=APPROVED

# Get applications from APAC region
curl http://localhost:5003/loan-application/list?region=APAC

# Get first 10 rejected applications
curl http://localhost:5003/loan-application/list?status=REJECTED&limit=10
```

#### Manual Review Endpoints

- **GET /loan-application/pending** – List every submission awaiting manual approval.

  ```bash
  curl http://localhost:5003/loan-application/pending
  ```

- **POST /loan-application/{application_id}/approve** – Approve a pending request and trigger automated verification.

  ```bash
  curl -X POST http://localhost:5003/loan-application/LOAN-20250101-ABCD1234/approve
  ```

- **POST /loan-application/{application_id}/reject** – Reject a pending request (optional JSON body `{ "reason": "..." }`).

  ```bash
  curl -X POST http://localhost:5003/loan-application/LOAN-20250101-ABCD1234/reject \
    -H "Content-Type: application/json" \
    -d '{"reason":"Bank statements missing"}'
  ```

#### POST /loan-application/reprocess/<application_id>
Reprocess an application through the verification workflow

**Example:**
```bash
curl -X POST http://localhost:5003/loan-application/reprocess/LOAN-20241108-ABC12345
```

### 3. Dashboard Analytics Routes

#### GET /dashboard/overview
Get overall statistics

**Response:**
```json
{
  "total_applications": 150,
  "approved": 85,
  "rejected": 60,
  "pending": 5,
  "approval_rate": 56.67
}
```

**Example:**
```bash
curl http://localhost:5003/dashboard/overview
```

#### GET /dashboard/by-region
Get application statistics grouped by region

**Response:**
```json
{
  "regions": [
    {
      "region": "APAC",
      "total": 45,
      "approved": 25,
      "rejected": 18,
      "pending": 2
    },
    {
      "region": "EMEA",
      "total": 38,
      "approved": 22,
      "rejected": 15,
      "pending": 1
    },
    ...
  ]
}
```

**Example:**
```bash
curl http://localhost:5003/dashboard/by-region
```

#### GET /dashboard/by-country
Get application statistics grouped by country

**Response:**
```json
{
  "countries": [
    {
      "country": "United States",
      "region": "AMERICAS",
      "total": 25,
      "approved": 15,
      "rejected": 10
    },
    ...
  ]
}
```

**Example:**
```bash
curl http://localhost:5003/dashboard/by-country
```

#### GET /dashboard/verification-stats
Get statistics on each verification stage

**Response:**
```json
{
  "kyc": {
    "approved": 120,
    "rejected": 30,
    "pass_rate": 80.0
  },
  "compliance": {
    "approved": 110,
    "rejected": 40,
    "pass_rate": 73.33,
    "political_connections": 8,
    "senior_relatives": 12
  },
  "eligibility": {
    "approved": 90,
    "rejected": 60,
    "pass_rate": 60.0
  }
}
```

**Example:**
```bash
curl http://localhost:5003/dashboard/verification-stats
```

#### GET /dashboard/financial-metrics
Get financial metrics for approved applications

**Response:**
```json
{
  "average_credit_score": 715.5,
  "average_dti_ratio": 0.32,
  "average_loan_amount": 185000.0,
  "total_loan_amount": 15725000.0,
  "average_income": 92500.0
}
```

**Example:**
```bash
curl http://localhost:5003/dashboard/financial-metrics
```

#### GET /dashboard/timeline
Get application trends over time

**Query Parameters:**
- `days`: Number of days to retrieve (default: 30)

**Response:**
```json
{
  "timeline": [
    {
      "date": "2024-11-08",
      "total": 8,
      "approved": 5,
      "rejected": 3
    },
    ...
  ]
}
```

**Example:**
```bash
curl http://localhost:5003/dashboard/timeline?days=7
```

## Verification Logic

### KYC Verification
- Email format validation
- Phone number validation (minimum 10 digits)
- Document upload verification
- Name validation (minimum 3 characters)
- Region and country validation

### Legal Compliance Check
- Political connections screening (10% random for POC)
- Senior employee relative detection
- Sanctions list screening
- High-risk country check
- High-value transaction flagging (>$500,000)

### Loan Eligibility Assessment
- **DTI Ratio**: Must be < 40% (debt/income)
- **Credit Score**: Must be ≥ 650
- **Income Sufficiency**: Annual income ≥ 3x loan amount
- **Maximum Loan**: $1,000,000
- **Minimum Income**: $30,000

### Final Decision
All three stages (KYC, Compliance, Eligibility) must be APPROVED for final approval.

## Running the Application

### Using Docker Compose

1. Start all services:
```bash
docker-compose up --build
```

2. The application will be available at `http://localhost:5003`

### Generate Sample Data

To populate the database with sample loan applications:

```bash
# Inside the container
python generate_sample_data.py

# Or uncomment the line in start.sh and rebuild
```

## Testing

### Test Complete Workflow

```bash
# Submit a loan application
curl -X POST http://localhost:5003/loan-application/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "region": "AMERICAS",
    "country": "United States",
    "income": 80000,
    "debt": 20000,
    "credit_score": 720,
    "loan_amount": 200000,
    "loan_purpose": "Home Purchase"
  }'

# Check the application status (replace with actual application_id from response)
curl http://localhost:5003/loan-application/status/LOAN-20241108-XXXXXXXX

# View dashboard analytics
curl http://localhost:5003/dashboard/overview
curl http://localhost:5003/dashboard/by-region
curl http://localhost:5003/dashboard/verification-stats
```

## Dashboard Visualization

The dashboard endpoints provide data for visualizing:

1. **Regional Distribution**: Applications by APAC, EMEA, AMERICAS, MEA regions
2. **Country-wise Breakdown**: Detailed country-level statistics
3. **Approval Funnel**: Pass rates at each verification stage
4. **Financial Metrics**: Average credit scores, DTI ratios, loan amounts
5. **Timeline Trends**: Application volume over time

Use these endpoints to build a frontend dashboard with charts showing:
- Pie charts for regional distribution
- Bar charts for country-wise applications
- Funnel charts for verification stages
- Line charts for timeline trends
- KPI cards for key metrics

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (missing/invalid fields)
- `404`: Not Found
- `409`: Conflict (duplicate entry)
- `500`: Internal Server Error

## Notes

- The system processes applications synchronously in the POC. In production, use asynchronous processing (Celery, Kafka, etc.)
- Email and alert notifications are simulated (logged to console). Integrate with actual email service in production.
- The verification logic uses simplified rules for POC. Implement real KYC, compliance, and credit check integrations in production.
- Database uses PostgreSQL (configure credentials via `.env`). For other environments, update `db.js` accordingly.

## Future Enhancements

1. Asynchronous processing with Kafka/Celery
2. Real email integration (SendGrid, AWS SES)
3. Document upload and OCR processing
4. Real-time dashboard with WebSockets
5. Admin panel for manual review
6. Audit logs and compliance reporting
7. Integration with external credit bureaus
8. Multi-factor authentication
9. Role-based access control
10. API rate limiting and authentication
#### GET /approval-logs
Audit trail for manual approvals/rejections (most recent first).

```bash
curl http://localhost:5003/approval-logs
```
Use `?limit=50` or `?application_id=LOAN-...` to filter results.
