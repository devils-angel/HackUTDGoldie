#!/bin/sh
set -e

npm install
npm run seed:stocks
node seedLoanData.js 5
npm start
