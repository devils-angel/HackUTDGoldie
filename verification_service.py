"""
Verification service module for loan application processing
Handles KYC verification, legal compliance checks, and loan eligibility assessment
"""
import random
from datetime import datetime
from models import db, LoanApplication

class VerificationService:
    """Service class to handle all verification stages of loan application"""
    
    @staticmethod
    def perform_kyc_verification(application):
        """
        Perform KYC (Know Your Customer) verification
        Checks: Basic identity verification, email format, phone format, document availability
        """
        print(f"[KYC] Starting verification for application {application.application_id}")
        
        remarks = []
        is_approved = True
        
        # Check 1: Email format validation
        if '@' not in application.email or '.' not in application.email:
            remarks.append("Invalid email format")
            is_approved = False
        else:
            remarks.append("Email format valid")
        
        # Check 2: Phone number validation (basic)
        if application.phone and len(application.phone) < 10:
            remarks.append("Phone number too short")
            is_approved = False
        else:
            remarks.append("Phone number valid")
        
        # Check 3: Document verification
        if not application.documents_uploaded:
            remarks.append("Required documents not uploaded")
            is_approved = False
        else:
            remarks.append("Documents uploaded and verified")
        
        # Check 4: Name validation
        if len(application.name.strip()) < 3:
            remarks.append("Invalid name")
            is_approved = False
        else:
            remarks.append("Name verified")
        
        # Check 5: Region and country validation
        valid_regions = ['APAC', 'EMEA', 'AMERICAS', 'MEA', 'NA', 'SA', 'EU', 'ASIA']
        if application.region.upper() not in valid_regions:
            remarks.append(f"Invalid region: {application.region}")
            is_approved = False
        else:
            remarks.append(f"Region verified: {application.region}")
        
        # Update application status
        application.kyc_status = 'APPROVED' if is_approved else 'REJECTED'
        application.kyc_verified_at = datetime.utcnow()
        application.kyc_remarks = '; '.join(remarks)
        
        db.session.commit()
        
        print(f"[KYC] {application.kyc_status} - {application.kyc_remarks}")
        return is_approved
    
    @staticmethod
    def perform_compliance_check(application):
        """
        Perform legal compliance check
        Checks: Political connections, senior employee relatives, sanctions list, etc.
        """
        print(f"[COMPLIANCE] Starting check for application {application.application_id}")
        
        remarks = []
        is_approved = True
        
        # Simulated checks (in real scenario, these would query external databases)
        
        # Check 1: Political connections screening
        # For POC: Random simulation with bias towards approval
        political_connection_detected = random.random() < 0.1  # 10% chance
        application.political_connection = political_connection_detected
        
        if political_connection_detected:
            remarks.append("Political connection detected - requires manual review")
            is_approved = False
        else:
            remarks.append("No political connections found")
        
        # Check 2: Senior employee relative check
        # Check if applicant's name contains common indicators (simplified for POC)
        senior_relative_indicators = ['jr', 'sr', 'ceo', 'cfo', 'director']
        senior_relative_detected = any(indicator in application.name.lower() for indicator in senior_relative_indicators)
        application.senior_relative = senior_relative_detected
        
        if senior_relative_detected:
            remarks.append("Potential senior employee relative - requires verification")
            is_approved = False
        else:
            remarks.append("No senior employee relation detected")
        
        # Check 3: Sanctions list screening
        # Simplified check based on email domain
        sanctioned_domains = ['sanctioned.com', 'blocked.net', 'restricted.org']
        email_domain = application.email.split('@')[-1] if '@' in application.email else ''
        
        if email_domain in sanctioned_domains:
            remarks.append(f"Email domain on sanctions list: {email_domain}")
            is_approved = False
        else:
            remarks.append("Email domain cleared")
        
        # Check 4: High-risk country check
        high_risk_countries = ['Country-X', 'Country-Y']  # Placeholder
        if application.country in high_risk_countries:
            remarks.append(f"High-risk country: {application.country}")
            is_approved = False
        else:
            remarks.append(f"Country risk assessment: CLEAR")
        
        # Check 5: Loan amount threshold check (anti-money laundering)
        if application.loan_amount > 500000:
            remarks.append(f"High-value transaction (${application.loan_amount:,.2f}) - enhanced due diligence required")
            # Don't automatically reject, just flag for review
        
        # Update application status
        application.compliance_status = 'APPROVED' if is_approved else 'REJECTED'
        application.compliance_verified_at = datetime.utcnow()
        application.compliance_remarks = '; '.join(remarks)
        
        db.session.commit()
        
        print(f"[COMPLIANCE] {application.compliance_status} - {application.compliance_remarks}")
        return is_approved
    
    @staticmethod
    def perform_eligibility_check(application):
        """
        Perform loan eligibility assessment
        Checks: Debt-to-income ratio, credit score, income sufficiency
        """
        print(f"[ELIGIBILITY] Starting assessment for application {application.application_id}")
        
        remarks = []
        is_approved = True
        
        # Check 1: Calculate and verify Debt-to-Income (DTI) ratio
        if application.income > 0:
            dti_ratio = round(application.debt / application.income, 3)
            application.dti_ratio = dti_ratio
            
            # DTI should be less than 40% (0.4) for approval
            if dti_ratio >= 0.4:
                remarks.append(f"High DTI ratio: {dti_ratio:.1%} (threshold: 40%)")
                is_approved = False
            else:
                remarks.append(f"DTI ratio acceptable: {dti_ratio:.1%}")
        else:
            remarks.append("Invalid income value")
            is_approved = False
        
        # Check 2: Credit score verification
        if application.credit_score < 650:
            remarks.append(f"Credit score below minimum: {application.credit_score} (minimum: 650)")
            is_approved = False
        elif application.credit_score < 700:
            remarks.append(f"Credit score marginal: {application.credit_score}")
        else:
            remarks.append(f"Credit score good: {application.credit_score}")
        
        # Check 3: Income sufficiency for loan amount
        # Rule: Annual income should be at least 3x the loan amount
        if application.income * 3 < application.loan_amount:
            remarks.append(f"Insufficient income for loan amount (Income: ${application.income:,.2f}, Loan: ${application.loan_amount:,.2f})")
            is_approved = False
        else:
            remarks.append(f"Income sufficient for requested loan amount")
        
        # Check 4: Maximum loan amount check
        max_loan = 1000000  # $1M maximum
        if application.loan_amount > max_loan:
            remarks.append(f"Loan amount exceeds maximum: ${application.loan_amount:,.2f} (max: ${max_loan:,.2f})")
            is_approved = False
        
        # Check 5: Minimum income requirement
        min_income = 30000  # $30K minimum annual income
        if application.income < min_income:
            remarks.append(f"Income below minimum requirement: ${application.income:,.2f} (min: ${min_income:,.2f})")
            is_approved = False
        
        # Update application status
        application.eligibility_status = 'APPROVED' if is_approved else 'REJECTED'
        application.eligibility_verified_at = datetime.utcnow()
        application.eligibility_remarks = '; '.join(remarks)
        
        db.session.commit()
        
        print(f"[ELIGIBILITY] {application.eligibility_status} - {application.eligibility_remarks}")
        return is_approved
    
    @staticmethod
    def finalize_application(application):
        """
        Finalize the application based on all verification results
        """
        print(f"[FINALIZE] Processing final decision for application {application.application_id}")
        
        # All checks must be APPROVED for final approval
        all_approved = (
            application.kyc_status == 'APPROVED' and
            application.compliance_status == 'APPROVED' and
            application.eligibility_status == 'APPROVED'
        )
        
        if all_approved:
            application.final_status = 'APPROVED'
            application.final_remarks = 'All verification checks passed. Loan application approved.'
        else:
            application.final_status = 'REJECTED'
            failed_checks = []
            if application.kyc_status != 'APPROVED':
                failed_checks.append('KYC')
            if application.compliance_status != 'APPROVED':
                failed_checks.append('Compliance')
            if application.eligibility_status != 'APPROVED':
                failed_checks.append('Eligibility')
            
            application.final_remarks = f'Loan application rejected. Failed checks: {", ".join(failed_checks)}'
        
        application.final_decision_at = datetime.utcnow()
        db.session.commit()
        
        print(f"[FINALIZE] {application.final_status} - {application.final_remarks}")
        return application.final_status == 'APPROVED'
    
    @staticmethod
    def send_notification(application):
        """
        Send alert/email notification to client
        In production, this would integrate with email service and alert system
        """
        print(f"[NOTIFICATION] Sending notification for application {application.application_id}")
        
        # Simulate email sending
        email_subject = f"Loan Application {application.application_id} - {application.final_status}"
        email_body = f"""
        Dear {application.name},
        
        Your loan application (ID: {application.application_id}) has been {application.final_status}.
        
        Application Details:
        - Loan Amount: ${application.loan_amount:,.2f}
        - Final Status: {application.final_status}
        - Decision Date: {application.final_decision_at}
        
        Remarks: {application.final_remarks}
        
        Thank you for choosing our services.
        
        Best regards,
        Loan Processing Team
        """
        
        print(f"[EMAIL] To: {application.email}")
        print(f"[EMAIL] Subject: {email_subject}")
        print(f"[EMAIL] Body: {email_body[:100]}...")
        
        # Simulate alert sending
        alert_message = f"Application {application.application_id} {application.final_status} for {application.name}"
        print(f"[ALERT] {alert_message}")
        
        # Update notification status
        application.email_sent = True
        application.alert_sent = True
        db.session.commit()
        
        return True
    
    @staticmethod
    def process_application(application_id):
        """
        Process entire loan application through all stages
        """
        application = LoanApplication.query.filter_by(application_id=application_id).first()
        
        if not application:
            print(f"[ERROR] Application {application_id} not found")
            return False
        
        print(f"\n{'='*60}")
        print(f"Processing Loan Application: {application_id}")
        print(f"Applicant: {application.name}")
        print(f"{'='*60}\n")
        
        # Stage 1: KYC Verification
        kyc_passed = VerificationService.perform_kyc_verification(application)
        
        if not kyc_passed:
            print("\n[WORKFLOW] KYC verification failed. Stopping process.")
            application.final_status = 'REJECTED'
            application.final_remarks = 'Application rejected at KYC stage'
            application.final_decision_at = datetime.utcnow()
            db.session.commit()
            VerificationService.send_notification(application)
            return False
        
        # Stage 2: Compliance Check
        compliance_passed = VerificationService.perform_compliance_check(application)
        
        if not compliance_passed:
            print("\n[WORKFLOW] Compliance check failed. Stopping process.")
            application.final_status = 'REJECTED'
            application.final_remarks = 'Application rejected at compliance stage'
            application.final_decision_at = datetime.utcnow()
            db.session.commit()
            VerificationService.send_notification(application)
            return False
        
        # Stage 3: Eligibility Assessment
        eligibility_passed = VerificationService.perform_eligibility_check(application)
        
        if not eligibility_passed:
            print("\n[WORKFLOW] Eligibility check failed. Stopping process.")
            application.final_status = 'REJECTED'
            application.final_remarks = 'Application rejected at eligibility stage'
            application.final_decision_at = datetime.utcnow()
            db.session.commit()
            VerificationService.send_notification(application)
            return False
        
        # Stage 4: Finalize Application
        approved = VerificationService.finalize_application(application)
        
        # Stage 5: Send Notifications
        VerificationService.send_notification(application)
        
        print(f"\n{'='*60}")
        print(f"Application Processing Complete: {application.final_status}")
        print(f"{'='*60}\n")
        
        return approved