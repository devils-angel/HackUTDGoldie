import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { parse } from "csv-parse/sync";
import { query } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, "stocks.csv");

const normalizeFloat = (value) =>
  typeof value === "string"
    ? parseFloat(value.replace(/[%+,]/g, ""))
    : Number(value);

const normalizeInt = (value) =>
  typeof value === "string"
    ? parseInt(value.replace(/[,]/g, ""), 10)
    : Number(value);

export const seedStocks = async ({ silent = false } = {}) => {
  const content = fs.readFileSync(csvPath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  });

  await query("TRUNCATE TABLE stocks RESTART IDENTITY");

  const insertText = `INSERT INTO stocks
    (symbol, name, last, change, percent_change, price_volume, time)
    VALUES ($1,$2,$3,$4,$5,$6,$7)`;

  await Promise.all(
    records.map((row) =>
      query(insertText, [
        row["Symbol"],
        row["Name"],
        normalizeFloat(row["Last"]),
        normalizeFloat(row["Change"]),
        normalizeFloat(row["%Change"]),
        normalizeInt(row["Price Vol"]),
        row["Time"]
      ])
    )
  );

  if (!silent) {
    console.log(`Seeded ${records.length} stock records`);
  }

  return records.length;
};

export const seedBankAccounts = async ({ silent = false } = {}) => {
  const sampleAccounts = [
    {
      owner_email: "cleoclient@example.com",
      account_number: "9876543210",
      bank_name: "OnboardIQ Savings",
      account_type: "SAVINGS",
      purpose: "Personal Use",
      legal_name: "Cleo Client",
      dob: "1990-05-10",
      ssn: "123-45-6789",
      residential_address: "123 Main St, Dallas, TX",
      mailing_address: "123 Main St, Dallas, TX",
      email: "cleoclient@example.com",
      phone: "+12145551234",
      citizen_status: "US Citizen",
      employed: true,
      annual_income: 85000,
      balance: 25000
    },
    {
      owner_email: "victor.vendor@example.com",
      account_number: "1234509876",
      bank_name: "Vendor Credit Union",
      account_type: "BUSINESS",
      purpose: "Business Operations",
      legal_name: "Victor Vendor",
      dob: "1985-09-02",
      ssn: "987-65-4321",
      residential_address: "456 Enterprise Rd, Austin, TX",
      mailing_address: "PO Box 123, Austin, TX",
      email: "victor.vendor@example.com",
      phone: "+15125551234",
      citizen_status: "US Citizen",
      employed: true,
      annual_income: 150000,
      balance: 125000
    }
  ];

  await query("DELETE FROM bank_accounts");
  await Promise.all(
    sampleAccounts.map((account) =>
      query(
        `INSERT INTO bank_accounts
          (owner_email, account_number, bank_name, account_type, purpose, legal_name, dob, ssn, residential_address, mailing_address, email, phone, citizen_status, employed, annual_income, balance)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          account.owner_email,
          account.account_number,
          account.bank_name,
          account.account_type,
          account.purpose,
          account.legal_name,
          account.dob,
          account.ssn,
          account.residential_address,
          account.mailing_address,
          account.email,
          account.phone,
          account.citizen_status,
          account.employed,
          account.annual_income,
          account.balance
        ]
      )
    )
  );

  if (!silent) {
    console.log(`Seeded ${sampleAccounts.length} bank accounts`);
  }
  return sampleAccounts.length;
};

const isCliRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliRun) {
  await seedStocks();
  await seedBankAccounts();
  process.exit(0);
}
