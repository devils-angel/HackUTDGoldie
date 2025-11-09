#!/bin/sh
set -e

python seed_data.py
python seed_loan_data.py 5
python app.py