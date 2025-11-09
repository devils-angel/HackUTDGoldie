#!/bin/sh
set -e

python seed_loan_data.py 5
python app.py