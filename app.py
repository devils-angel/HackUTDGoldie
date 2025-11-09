import os
import uuid
import json
from datetime import datetime
from flask import Flask, jsonify, request
from models import db, Stock, User, LoanApplication
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from verification_service import VerificationService
from sqlalchemy import func

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()

    # ===================== ORIGINAL ROUTES =====================
    
    @app.route('/')
    def hello():
        return 'Hello from Python + Docker! Loan Application System Active.'

    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        print(data)
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        # Validate fields
        if not name or not email or not password:
            return jsonify({"error": "Missing fields"}), 400

        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Email already registered"}), 409

        # Hash password and store user
        hashed_password = generate_password_hash(password)
        new_user = User(name=name, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User registered successfully"}), 201
    
    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        # Validate input
        if not email or not password:
            return jsonify({"error": "Missing email or password"}), 400

        # Find user
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Verify password
        if not check_password_hash(user.password, password):
            return jsonify({"error": "Invalid credentials"}), 401

        # Success
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }), 200

    # Simple route to query database
    @app.route('/data')
    def get_stocks():
        stocks = Stock.query.all()
        # Serialize SQLAlchemy objects to JSON-safe structure
        result = [
            {
                "id": s.id,
                "symbol": s.symbol,
                "name": s.name,
                "last": s.last,
                "change": s.change,
                "percent_change": s.percent_change,
                "price_volume": s.price_volume,
                "time": s.time.isoformat() if s.time else None,
            }
            for s in stocks
        ]
        return jsonify(result)

    # Original Loan Application Route (kept for backward compatibility)
    @app.route('/loan', methods=['POST'])
    def loan_application_simple():
        """Simple loan eligibility check - original functionality"""
        data = request.get_json()

        name = data.get('name')
        email = data.get('email')
        income = data.get('income', 0)
        debt = data.get('debt', 0)
        credit_score = data.get('credit_score', 0)

        # Basic validation
        if not all([name, email, income, debt, credit_score]):
            return jsonify({"error": "Missing required fields"}), 400

        # Compute debt-to-income ratio
        try:
            income = float(income)
            debt = float(debt)
            credit_score = int(credit_score)
        except ValueError:
            return jsonify({"error": "Invalid numeric values"}), 400

        dti = round(debt / income, 2) if income > 0 else None

        # Simple eligibility logic
        if dti is not None and dti < 0.4 and credit_score >= 650:
            recommendation = "Eligible"
        else:
            recommendation = "Not Eligible"

        # Return result
        return jsonify({
            "name": name,
            "email": email,
            "income": income,
            "debt": debt,
            "credit_score": credit_score,
            "dti": dti,
            "recommendation": recommendation
        }), 200

    # ===================== NEW LOAN APPLICATION ROUTES =====================
    
    @app.route('/loan-application/submit', methods=['POST'])
    def submit_loan_application():
        """
        Submit a new loan application with complete workflow processing
        Accepts: name, email, phone, region, country, income, debt, credit_score, 
                loan_amount, loan_purpose, documents
        """
        try:
            data = request.get_json()
            
            # Required fields validation
            required_fields = ['name', 'email', 'region', 'country', 'income', 
                             'debt', 'credit_score', 'loan_amount']
            
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return jsonify({
                    "error": "Missing required fields",
                    "missing": missing_fields
                }), 400
            
            # Generate unique application ID
            application_id = f"LOAN-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            # Create loan application record
            loan_app = LoanApplication(
                application_id=application_id,
                name=data.get('name'),
                email=data.get('email'),
                phone=data.get('phone', ''),
                region=data.get('region').upper(),
                country=data.get('country'),
                income=float(data.get('income')),
                debt=float(data.get('debt')),
                credit_score=int(data.get('credit_score')),
                loan_amount=float(data.get('loan_amount')),
                loan_purpose=data.get('loan_purpose', ''),
                documents_uploaded=data.get('documents_uploaded', True),  # Assume docs uploaded for POC
                document_list=json.dumps(data.get('documents', ['ID_Proof', 'Income_Statement', 'Address_Proof']))
            )
            
            # Save to database
            db.session.add(loan_app)
            db.session.commit()
            
            # Process application through verification workflow
            # In production, this would be done asynchronously
            VerificationService.process_application(application_id)
            
            # Retrieve updated application
            loan_app = LoanApplication.query.filter_by(application_id=application_id).first()
            
            return jsonify({
                "message": "Loan application submitted and processed successfully",
                "application": loan_app.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    @app.route('/loan-application/status/<application_id>', methods=['GET'])
    def get_application_status(application_id):
        """Get the status of a specific loan application"""
        loan_app = LoanApplication.query.filter_by(application_id=application_id).first()
        
        if not loan_app:
            return jsonify({"error": "Application not found"}), 404
        
        return jsonify(loan_app.to_dict()), 200
    
    @app.route('/loan-application/list', methods=['GET'])
    def list_applications():
        """List all loan applications with optional filtering"""
        # Query parameters for filtering
        status = request.args.get('status')  # PENDING, APPROVED, REJECTED
        region = request.args.get('region')
        limit = request.args.get('limit', 100, type=int)
        
        query = LoanApplication.query
        
        if status:
            query = query.filter_by(final_status=status.upper())
        if region:
            query = query.filter_by(region=region.upper())
        
        applications = query.order_by(LoanApplication.created_at.desc()).limit(limit).all()
        
        return jsonify({
            "total": len(applications),
            "applications": [app.to_dict() for app in applications]
        }), 200
    
    @app.route('/loan-application/reprocess/<application_id>', methods=['POST'])
    def reprocess_application(application_id):
        """Reprocess a loan application through verification workflow"""
        loan_app = LoanApplication.query.filter_by(application_id=application_id).first()
        
        if not loan_app:
            return jsonify({"error": "Application not found"}), 404
        
        # Reset statuses
        loan_app.kyc_status = 'PENDING'
        loan_app.compliance_status = 'PENDING'
        loan_app.eligibility_status = 'PENDING'
        loan_app.final_status = 'PENDING'
        db.session.commit()
        
        # Reprocess
        VerificationService.process_application(application_id)
        
        # Get updated status
        loan_app = LoanApplication.query.filter_by(application_id=application_id).first()
        
        return jsonify({
            "message": "Application reprocessed successfully",
            "application": loan_app.to_dict()
        }), 200
    
    # ===================== DASHBOARD ANALYTICS ROUTES =====================
    
    @app.route('/dashboard/overview', methods=['GET'])
    def dashboard_overview():
        """Get overall dashboard statistics"""
        total_applications = LoanApplication.query.count()
        approved = LoanApplication.query.filter_by(final_status='APPROVED').count()
        rejected = LoanApplication.query.filter_by(final_status='REJECTED').count()
        pending = LoanApplication.query.filter_by(final_status='PENDING').count()
        
        return jsonify({
            "total_applications": total_applications,
            "approved": approved,
            "rejected": rejected,
            "pending": pending,
            "approval_rate": round((approved / total_applications * 100) if total_applications > 0 else 0, 2)
        }), 200
    
    @app.route('/dashboard/by-region', methods=['GET'])
    def dashboard_by_region():
        """Get application statistics by region"""
        # Group by region and status
        results = db.session.query(
            LoanApplication.region,
            LoanApplication.final_status,
            func.count(LoanApplication.id).label('count')
        ).group_by(LoanApplication.region, LoanApplication.final_status).all()
        
        # Format results
        region_data = {}
        for region, status, count in results:
            if region not in region_data:
                region_data[region] = {
                    'region': region,
                    'total': 0,
                    'approved': 0,
                    'rejected': 0,
                    'pending': 0
                }
            
            region_data[region]['total'] += count
            region_data[region][status.lower()] = count
        
        return jsonify({
            "regions": list(region_data.values())
        }), 200
    
    @app.route('/dashboard/by-country', methods=['GET'])
    def dashboard_by_country():
        """Get application statistics by country"""
        results = db.session.query(
            LoanApplication.country,
            LoanApplication.region,
            func.count(LoanApplication.id).label('count'),
            func.sum(func.case((LoanApplication.final_status == 'APPROVED', 1), else_=0)).label('approved'),
            func.sum(func.case((LoanApplication.final_status == 'REJECTED', 1), else_=0)).label('rejected')
        ).group_by(LoanApplication.country, LoanApplication.region).all()
        
        country_data = [
            {
                'country': country,
                'region': region,
                'total': count,
                'approved': approved,
                'rejected': rejected
            }
            for country, region, count, approved, rejected in results
        ]
        
        return jsonify({
            "countries": country_data
        }), 200
    
    @app.route('/dashboard/verification-stats', methods=['GET'])
    def verification_stats():
        """Get statistics on verification stages"""
        kyc_approved = LoanApplication.query.filter_by(kyc_status='APPROVED').count()
        kyc_rejected = LoanApplication.query.filter_by(kyc_status='REJECTED').count()
        
        compliance_approved = LoanApplication.query.filter_by(compliance_status='APPROVED').count()
        compliance_rejected = LoanApplication.query.filter_by(compliance_status='REJECTED').count()
        
        eligibility_approved = LoanApplication.query.filter_by(eligibility_status='APPROVED').count()
        eligibility_rejected = LoanApplication.query.filter_by(eligibility_status='REJECTED').count()
        
        political_connections = LoanApplication.query.filter_by(political_connection=True).count()
        senior_relatives = LoanApplication.query.filter_by(senior_relative=True).count()
        
        return jsonify({
            "kyc": {
                "approved": kyc_approved,
                "rejected": kyc_rejected,
                "pass_rate": round((kyc_approved / (kyc_approved + kyc_rejected) * 100) if (kyc_approved + kyc_rejected) > 0 else 0, 2)
            },
            "compliance": {
                "approved": compliance_approved,
                "rejected": compliance_rejected,
                "pass_rate": round((compliance_approved / (compliance_approved + compliance_rejected) * 100) if (compliance_approved + compliance_rejected) > 0 else 0, 2),
                "political_connections": political_connections,
                "senior_relatives": senior_relatives
            },
            "eligibility": {
                "approved": eligibility_approved,
                "rejected": eligibility_rejected,
                "pass_rate": round((eligibility_approved / (eligibility_approved + eligibility_rejected) * 100) if (eligibility_approved + eligibility_rejected) > 0 else 0, 2)
            }
        }), 200
    
    @app.route('/dashboard/financial-metrics', methods=['GET'])
    def financial_metrics():
        """Get financial metrics from applications"""
        results = db.session.query(
            func.avg(LoanApplication.credit_score).label('avg_credit_score'),
            func.avg(LoanApplication.dti_ratio).label('avg_dti'),
            func.avg(LoanApplication.loan_amount).label('avg_loan_amount'),
            func.sum(LoanApplication.loan_amount).label('total_loan_amount'),
            func.avg(LoanApplication.income).label('avg_income')
        ).filter(LoanApplication.final_status == 'APPROVED').first()
        
        return jsonify({
            "average_credit_score": round(results.avg_credit_score, 2) if results.avg_credit_score else 0,
            "average_dti_ratio": round(results.avg_dti, 3) if results.avg_dti else 0,
            "average_loan_amount": round(results.avg_loan_amount, 2) if results.avg_loan_amount else 0,
            "total_loan_amount": round(results.total_loan_amount, 2) if results.total_loan_amount else 0,
            "average_income": round(results.avg_income, 2) if results.avg_income else 0
        }), 200
    
    @app.route('/dashboard/timeline', methods=['GET'])
    def application_timeline():
        """Get application trends over time"""
        days = request.args.get('days', 30, type=int)
        
        # This is a simplified version - in production you'd want proper date grouping
        results = db.session.query(
            func.date(LoanApplication.created_at).label('date'),
            func.count(LoanApplication.id).label('count'),
            func.sum(func.case((LoanApplication.final_status == 'APPROVED', 1), else_=0)).label('approved'),
            func.sum(func.case((LoanApplication.final_status == 'REJECTED', 1), else_=0)).label('rejected')
        ).group_by(func.date(LoanApplication.created_at)).order_by(func.date(LoanApplication.created_at).desc()).limit(days).all()
        
        timeline_data = [
            {
                'date': str(date),
                'total': count,
                'approved': approved,
                'rejected': rejected
            }
            for date, count, approved, rejected in results
        ]
        
        return jsonify({
            "timeline": timeline_data
        }), 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5002)
