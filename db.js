import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const useInMemoryDb = process.env.IN_MEMORY_DB === "true";
const dbPath = path.join(__dirname, "database.db");
const db = useInMemoryDb ? new Database(":memory:") : new Database(dbPath);

if (useInMemoryDb) {
  console.warn("[DB] Running in-memory SQLite database. Data resets on restart.");
} else {
  db.pragma("journal_mode = WAL");
}
db.pragma("foreign_keys = ON");

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('ADMIN','VENDOR','CLIENT')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  `CREATE TABLE IF NOT EXISTS stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      last REAL NOT NULL,
      change REAL NOT NULL,
      percent_change REAL NOT NULL,
      price_volume INTEGER NOT NULL,
      time TEXT NOT NULL
    )`,
  `CREATE TABLE IF NOT EXISTS loan_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      region TEXT NOT NULL,
      country TEXT NOT NULL,
      income REAL NOT NULL,
      debt REAL NOT NULL,
      credit_score INTEGER NOT NULL,
      loan_amount REAL NOT NULL,
      loan_purpose TEXT,
      kyc_status TEXT DEFAULT 'PENDING',
      kyc_verified_at TEXT,
      kyc_remarks TEXT,
      compliance_status TEXT DEFAULT 'PENDING',
      compliance_verified_at TEXT,
      compliance_remarks TEXT,
      political_connection INTEGER DEFAULT 0,
      senior_relative INTEGER DEFAULT 0,
      eligibility_status TEXT DEFAULT 'PENDING',
      eligibility_verified_at TEXT,
      eligibility_remarks TEXT,
      dti_ratio REAL,
      final_status TEXT DEFAULT 'PENDING',
      final_decision_at TEXT,
      final_remarks TEXT,
      documents_uploaded INTEGER DEFAULT 0,
      document_list TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      alert_sent INTEGER DEFAULT 0,
      email_sent INTEGER DEFAULT 0
    )`
];

tableStatements.forEach((statement) => db.exec(statement));

try {
  db.exec(
    "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('ADMIN','VENDOR','CLIENT'))"
  );
} catch (err) {
  if (!String(err.message).includes("duplicate column name")) {
    throw err;
  }
}

export default db;
