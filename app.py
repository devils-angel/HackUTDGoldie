import os
from flask import Flask, jsonify, request
from models import db, Stock, User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()

    # Routes
    @app.route('/')
    def hello():
        return 'Hello from Python + Docker!'

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

            #Simple route to query database
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
        #return {stock.symbol: stock.last for stock in stocks}

    # --- Loan Application Route ---
    @app.route('/loan', methods=['POST'])
    def loan_application():
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

        # Optionally, store result in DB (not mandatory for POC)
        # new_app = LoanApplication(name=name, email=email, income=income, debt=debt,
        #                           credit_score=credit_score, dti=dti, recommendation=recommendation)
        # db.session.add(new_app)
        # db.session.commit()

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

    return app
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)
    
