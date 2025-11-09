import pandas as pd
from app import create_app, db
from models import Stock
from datetime import datetime

app = create_app()

df = pd.read_csv('stocks.csv')  # CSV with same column names as your model

def parse_float(value):
    if isinstance(value, str):
        return float(value.replace('+','').replace('%',''))
    return float(value)

def parse_int(value):
    if isinstance(value, str):
        return int(value.replace(',', ''))
    return int(value)

with app.app_context():
    records = [
        Stock(
            symbol=row['Symbol'],
            name=row['Name'],
            last=parse_float(row['Last']),
            change=parse_float(row['Change']),
            percent_change=parse_float(row['%Change']),
            price_volume=parse_int(row['Price Vol']),
            time=datetime.strptime(row['Time'], '%m/%d/%y').date()
        )
        for _, row in df.iterrows()
    ]
    db.session.bulk_save_objects(records)
    db.session.commit()

print("Data successfully inserted!")