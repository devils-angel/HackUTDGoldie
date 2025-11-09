from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func
from datetime import datetime

db = SQLAlchemy()

class Stock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    last = db.Column(db.Float, nullable=False)        # last traded price
    change = db.Column(db.Float, nullable=False)      # price change
    percent_change = db.Column(db.Float, nullable=False)  # % change
    price_volume = db.Column(db.BigInteger, nullable=False)
    time = db.Column(db.Date, nullable=False)         # date of record

    def __repr__(self):
        return f'<Stock {self.symbol} - {self.name}>'

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<User {self.email}>"

class LoanApplication(db.Model):
    __tablename__ = 'loan_applications'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.String(50), unique=True, nullable=False)
    
    # Client Basic Information
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    region = db.Column(db.String(50), nullable=False)  # APAC, EMEA, AMERICAS, etc.
    country = db.Column(db.String(50), nullable=False)
    
    # Financial Information
    income = db.Column(db.Float, nullable=False)
    debt = db.Column(db.Float, nullable=False)
    credit_score = db.Column(db.Integer, nullable=False)
    loan_amount = db.Column(db.Float, nullable=False)
    loan_purpose = db.Column(db.String(200))
    
    # KYC Verification Status
    kyc_status = db.Column(db.String(20), default='PENDING')  # PENDING, APPROVED, REJECTED
    kyc_verified_at = db.Column(db.DateTime)
    kyc_remarks = db.Column(db.Text)
    
    # Legal Compliance Check Status
    compliance_status = db.Column(db.String(20), default='PENDING')  # PENDING, APPROVED, REJECTED
    compliance_verified_at = db.Column(db.DateTime)
    compliance_remarks = db.Column(db.Text)
    political_connection = db.Column(db.Boolean, default=False)
    senior_relative = db.Column(db.Boolean, default=False)
    
    # Loan Eligibility Check Status
    eligibility_status = db.Column(db.String(20), default='PENDING')  # PENDING, APPROVED, REJECTED
    eligibility_verified_at = db.Column(db.DateTime)
    eligibility_remarks = db.Column(db.Text)
    dti_ratio = db.Column(db.Float)  # Debt-to-Income ratio
    
    # Final Application Status
    final_status = db.Column(db.String(20), default='PENDING')  # PENDING, APPROVED, REJECTED
    final_decision_at = db.Column(db.DateTime)
    final_remarks = db.Column(db.Text)
    
    # Documents
    documents_uploaded = db.Column(db.Boolean, default=False)
    document_list = db.Column(db.Text)  # JSON string of document names
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Alert/Email Status
    alert_sent = db.Column(db.Boolean, default=False)
    email_sent = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<LoanApplication {self.application_id} - {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'region': self.region,
            'country': self.country,
            'income': self.income,
            'debt': self.debt,
            'credit_score': self.credit_score,
            'loan_amount': self.loan_amount,
            'loan_purpose': self.loan_purpose,
            'kyc_status': self.kyc_status,
            'kyc_verified_at': self.kyc_verified_at.isoformat() if self.kyc_verified_at else None,
            'kyc_remarks': self.kyc_remarks,
            'compliance_status': self.compliance_status,
            'compliance_verified_at': self.compliance_verified_at.isoformat() if self.compliance_verified_at else None,
            'compliance_remarks': self.compliance_remarks,
            'political_connection': self.political_connection,
            'senior_relative': self.senior_relative,
            'eligibility_status': self.eligibility_status,
            'eligibility_verified_at': self.eligibility_verified_at.isoformat() if self.eligibility_verified_at else None,
            'eligibility_remarks': self.eligibility_remarks,
            'dti_ratio': self.dti_ratio,
            'final_status': self.final_status,
            'final_decision_at': self.final_decision_at.isoformat() if self.final_decision_at else None,
            'final_remarks': self.final_remarks,
            'documents_uploaded': self.documents_uploaded,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'alert_sent': self.alert_sent,
            'email_sent': self.email_sent
        }