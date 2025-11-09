import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const {
  DATABASE_URL,
  PGHOST = "localhost",
  PGPORT = "5432",
  PGUSER = "postgres",
  PGPASSWORD = "Pra@1ful",
  PGDATABASE = "postgres",
  PGSSL = "false"
} = process.env;

const connectionOptions = DATABASE_URL
  ? { connectionString: DATABASE_URL }
  : {
      host: PGHOST,
      port: Number(PGPORT),
      user: PGUSER,
      password: PGPASSWORD,
      database: PGDATABASE
    };

if (PGSSL && PGSSL.toLowerCase() === "true") {
  connectionOptions.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(connectionOptions);

const runMigrations = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('ADMIN','VENDOR','CLIENT')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stocks (
      id SERIAL PRIMARY KEY,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      last NUMERIC NOT NULL,
      change NUMERIC NOT NULL,
      percent_change NUMERIC NOT NULL,
      price_volume BIGINT NOT NULL,
      time DATE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS loan_applications (
      id SERIAL PRIMARY KEY,
      application_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      region TEXT NOT NULL,
      country TEXT NOT NULL,
      income NUMERIC NOT NULL,
      debt NUMERIC NOT NULL,
      credit_score INTEGER NOT NULL,
      loan_amount NUMERIC NOT NULL,
      loan_purpose TEXT,
      kyc_status TEXT DEFAULT 'PENDING',
      kyc_verified_at TIMESTAMPTZ,
      kyc_remarks TEXT,
      compliance_status TEXT DEFAULT 'PENDING',
      compliance_verified_at TIMESTAMPTZ,
      compliance_remarks TEXT,
      political_connection BOOLEAN DEFAULT FALSE,
      senior_relative BOOLEAN DEFAULT FALSE,
      eligibility_status TEXT DEFAULT 'PENDING',
      eligibility_verified_at TIMESTAMPTZ,
      eligibility_remarks TEXT,
      dti_ratio NUMERIC,
      final_status TEXT DEFAULT 'PENDING',
      final_decision_at TIMESTAMPTZ,
      final_remarks TEXT,
      documents_uploaded BOOLEAN DEFAULT FALSE,
      document_list TEXT,
      review_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (review_status IN ('PENDING','APPROVED','REJECTED')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      alert_sent BOOLEAN DEFAULT FALSE,
      email_sent BOOLEAN DEFAULT FALSE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS approval_logs (
      id SERIAL PRIMARY KEY,
      application_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_email TEXT,
      actor_role TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      role TEXT NOT NULL,
      application_id TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'UNREAD' CHECK (status IN ('UNREAD','READ')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id SERIAL PRIMARY KEY,
      owner_email TEXT NOT NULL,
      account_number TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      purpose TEXT,
      legal_name TEXT,
      dob DATE,
      ssn TEXT,
      residential_address TEXT,
      mailing_address TEXT,
      email TEXT,
      phone TEXT,
      citizen_status TEXT,
      employed BOOLEAN,
      annual_income NUMERIC,
      balance NUMERIC DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const bankAccountColumnAdds = [
    ["purpose", "TEXT"],
    ["legal_name", "TEXT"],
    ["dob", "DATE"],
    ["ssn", "TEXT"],
    ["residential_address", "TEXT"],
    ["mailing_address", "TEXT"],
    ["email", "TEXT"],
    ["phone", "TEXT"],
    ["citizen_status", "TEXT"],
    ["employed", "BOOLEAN"],
    ["annual_income", "NUMERIC"]
  ];

  for (const [column, type] of bankAccountColumnAdds) {
    await pool.query(
      `ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS ${column} ${type}`
    );
  }

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bank_accounts_account_number_key'
      ) THEN
        ALTER TABLE bank_accounts
        ADD CONSTRAINT bank_accounts_account_number_key UNIQUE (account_number);
      END IF;
    END $$;
  `);

  await pool.query(`
    ALTER TABLE loan_applications
    ADD COLUMN IF NOT EXISTS bank_account_id INTEGER REFERENCES bank_accounts(id)
  `);
};

await runMigrations();

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
export default { query, pool };
