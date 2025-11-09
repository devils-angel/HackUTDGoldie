"""
Sample Data Generator for Loan Applications
Generates test data to populate the database with sample loan applications
"""
import random
from datetime import datetime, timedelta
from app import create_app
from models import db, LoanApplication
from verification_service import VerificationService

# Sample data pools
REGIONS = ['APAC', 'EMEA', 'AMERICAS', 'MEA']

COUNTRIES_BY_REGION = {
    'APAC': ['India', 'China', 'Japan', 'Singapore', 'Australia', 'South Korea', 'Indonesia', 'Thailand'],
    'EMEA': ['United Kingdom', 'Germany', 'France', 'UAE', 'South Africa', 'Spain', 'Italy', 'Netherlands'],
    'AMERICAS': ['United States', 'Canada', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia'],
    'MEA': ['UAE', 'Saudi Arabia', 'Egypt', 'Kenya', 'Nigeria', 'Qatar']
}

FIRST_NAMES = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa',
    'William', 'Maria', 'James', 'Jennifer', 'Richard', 'Linda', 'Thomas', 'Patricia',
    'Raj', 'Priya', 'Mohammed', 'Fatima', 'Wei', 'Ming', 'Carlos', 'Sofia'
]

LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Patel', 'Kumar', 'Singh', 'Chen', 'Wang', 'Li',
    'Ahmed', 'Hassan', 'Fernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Taylor'
]

LOAN_PURPOSES = [
    'Home Purchase', 'Business Expansion', 'Education', 'Medical Expenses',
    'Debt Consolidation', 'Vehicle Purchase', 'Home Renovation', 'Working Capital',
    'Investment', 'Emergency Funds'
]

def generate_phone():
    """Generate a random phone number"""
    return f"+{random.randint(1, 999)}{random.randint(1000000000, 9999999999)}"

def generate_email(name):
    """Generate an email from name"""
    domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'email.com']
    return f"{name.lower().replace(' ', '.')}@{random.choice(domains)}"

def generate_sample_applications(count=50):
    """Generate sample loan applications"""
    
    app = create_app()
    
    with app.app_context():
        print(f"\n{'='*60}")
        print(f"Generating {count} Sample Loan Applications")
        print(f"{'='*60}\n")
        
        applications_created = 0
        
        for i in range(count):
            # Generate random applicant data
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            name = f"{first_name} {last_name}"
            
            region = random.choice(REGIONS)
            country = random.choice(COUNTRIES_BY_REGION[region])
            
            # Generate financial data with realistic distributions
            income = random.choice([
                random.randint(30000, 60000),   # Lower income bracket
                random.randint(60000, 100000),  # Middle income bracket
                random.randint(100000, 200000), # Upper-middle income bracket
                random.randint(200000, 500000)  # High income bracket
            ])
            
            # Debt varies - some with low debt, some with high
            debt_ratio = random.uniform(0.1, 0.6)
            debt = income * debt_ratio
            
            # Credit score distribution
            credit_score = random.choice([
                random.randint(550, 649),  # Below threshold
                random.randint(650, 699),  # At threshold
                random.randint(700, 749),  # Good
                random.randint(750, 850)   # Excellent
            ])
            
            # Loan amount typically 2-5x annual income
            loan_multiplier = random.uniform(2, 5)
            loan_amount = round(income * loan_multiplier, -3)  # Round to nearest thousand
            
            # Generate application ID
            date_offset = random.randint(0, 60)  # Applications from last 60 days
            created_date = datetime.now() - timedelta(days=date_offset)
            application_id = f"LOAN-{created_date.strftime('%Y%m%d')}-{random.randint(10000000, 99999999)}"
            
            # Create application
            loan_app = LoanApplication(
                application_id=application_id,
                name=name,
                email=generate_email(name),
                phone=generate_phone(),
                region=region,
                country=country,
                income=income,
                debt=debt,
                credit_score=credit_score,
                loan_amount=loan_amount,
                loan_purpose=random.choice(LOAN_PURPOSES),
                documents_uploaded=True,
                document_list='["ID_Proof", "Income_Statement", "Address_Proof", "Bank_Statement"]',
                created_at=created_date
            )
            
            db.session.add(loan_app)
            db.session.commit()
            
            # Process application
            print(f"[{i+1}/{count}] Processing application for {name} ({region}/{country})")
            VerificationService.process_application(application_id)
            
            applications_created += 1
        
        print(f"\n{'='*60}")
        print(f"Successfully created and processed {applications_created} applications")
        print(f"{'='*60}\n")
        
        # Print summary statistics
        total = LoanApplication.query.count()
        approved = LoanApplication.query.filter_by(final_status='APPROVED').count()
        rejected = LoanApplication.query.filter_by(final_status='REJECTED').count()
        
        print("\nSummary Statistics:")
        print(f"  Total Applications: {total}")
        print(f"  Approved: {approved} ({approved/total*100:.1f}%)")
        print(f"  Rejected: {rejected} ({rejected/total*100:.1f}%)")
        
        print("\nApplications by Region:")
        for region in REGIONS:
            count = LoanApplication.query.filter_by(region=region).count()
            print(f"  {region}: {count}")
        
        print("\n")

if __name__ == '__main__':
    # Generate 50 sample applications
    generate_sample_applications(50)