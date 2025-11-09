from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func

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