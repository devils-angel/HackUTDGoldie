import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import db from "./db.js";
import VerificationService from "./verificationService.js";
import {
  createLoanApplication,
  getLoanApplicationByApplicationId,
  listLoanApplications,
  resetApplicationStatuses,
  getLoanApplicationRow
} from "./loanService.js";
import { seedStocks } from "./seedData.js";
import { seedLoanApplications } from "./seedLoanData.js";

const PORT = process.env.PORT || 5003;
const useInMemoryDb = process.env.IN_MEMORY_DB === "true";
const USER_ROLES = ["ADMIN", "VENDOR", "CLIENT"];
const normalizeRole = (value) =>
  (value || "CLIENT").toString().trim().toUpperCase();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const stockMapper = (row) => ({
  ...row,
  time: row.time ? new Date(row.time).toISOString() : null
});

app.get("/", (req, res) => {
  res.send("Hello from Node.js + Express! Loan Application System Active.");
});

app.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, role: incomingRole } = req.body || {};
    const role = normalizeRole(incomingRole);

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({
        error: "Invalid role",
        allowed: USER_ROLES
      });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 12);
    db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
      name,
      email,
      hashed,
      role
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: { name, email, role }
    });
  })
);

app.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "CLIENT"
      }
    });
  })
);

app.get("/data", (req, res) => {
  const rows = db
    .prepare(
      "SELECT id, symbol, name, last, change, percent_change, price_volume, time FROM stocks ORDER BY id ASC"
    )
    .all()
    .map(stockMapper);
  res.json(rows);
});

app.post("/loan", (req, res) => {
  const { name, email, income, debt, credit_score: creditScore } = req.body || {};
  if (!name || !email || income == null || debt == null || creditScore == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const incomeValue = Number(income);
  const debtValue = Number(debt);
  const creditScoreValue = Number(creditScore);

  if (
    Number.isNaN(incomeValue) ||
    Number.isNaN(debtValue) ||
    Number.isNaN(creditScoreValue)
  ) {
    return res.status(400).json({ error: "Invalid numeric values" });
  }

  const dti = incomeValue > 0 ? Number((debtValue / incomeValue).toFixed(2)) : null;
  const recommendation =
    dti !== null && dti < 0.4 && creditScoreValue >= 650 ? "Eligible" : "Not Eligible";

  return res.json({
    name,
    email,
    income: incomeValue,
    debt: debtValue,
    credit_score: creditScoreValue,
    dti,
    recommendation
  });
});

app.post(
  "/loan-application/submit",
  asyncHandler(async (req, res) => {
    const data = req.body || {};
    const requiredFields = [
      "name",
      "email",
      "region",
      "country",
      "income",
      "debt",
      "credit_score",
      "loan_amount"
    ];
    const missing = requiredFields.filter((field) => data[field] == null || data[field] === "");
    if (missing.length) {
      return res.status(400).json({ error: "Missing required fields", missing });
    }

    const numericFields = ["income", "debt", "credit_score", "loan_amount"];
    const invalidNumeric = numericFields.filter((field) =>
      Number.isNaN(Number(data[field]))
    );
    if (invalidNumeric.length) {
      return res
        .status(400)
        .json({ error: "Invalid numeric values", invalid: invalidNumeric });
    }

    const application = createLoanApplication(data);
    VerificationService.processApplication(application.application_id);
    const refreshed = getLoanApplicationByApplicationId(application.application_id);

    return res.status(201).json({
      message: "Loan application submitted and processed successfully",
      application: refreshed
    });
  })
);

app.get("/loan-application/status/:applicationId", (req, res) => {
  const application = getLoanApplicationByApplicationId(req.params.applicationId);
  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }
  return res.json(application);
});

app.get("/loan-application/list", (req, res) => {
  const { status, region } = req.query;
  const limit = Number(req.query.limit) || 100;
  const applications = listLoanApplications({ status, region, limit });
  return res.json({ total: applications.length, applications });
});

app.post("/loan-application/reprocess/:applicationId", (req, res) => {
  const application = getLoanApplicationRow(req.params.applicationId);
  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }

  resetApplicationStatuses(req.params.applicationId);
  VerificationService.processApplication(req.params.applicationId);
  const refreshed = getLoanApplicationByApplicationId(req.params.applicationId);

  return res.json({
    message: "Application reprocessed successfully",
    application: refreshed
  });
});

app.get("/dashboard/overview", (req, res) => {
  const stats = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM loan_applications) AS total,
        (SELECT COUNT(*) FROM loan_applications WHERE final_status = 'APPROVED') AS approved,
        (SELECT COUNT(*) FROM loan_applications WHERE final_status = 'REJECTED') AS rejected,
        (SELECT COUNT(*) FROM loan_applications WHERE final_status = 'PENDING') AS pending`
    )
    .get();

  const approvalRate =
    stats.total > 0 ? Number(((stats.approved / stats.total) * 100).toFixed(2)) : 0;

  return res.json({
    total_applications: stats.total,
    approved: stats.approved,
    rejected: stats.rejected,
    pending: stats.pending,
    approval_rate: approvalRate
  });
});

app.get("/dashboard/by-region", (req, res) => {
  const rows = db
    .prepare(
      `SELECT region, final_status, COUNT(*) as count
       FROM loan_applications
       GROUP BY region, final_status`
    )
    .all();

  const regionMap = {};
  rows.forEach((row) => {
    if (!regionMap[row.region]) {
      regionMap[row.region] = {
        region: row.region,
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0
      };
    }
    regionMap[row.region].total += row.count;
    regionMap[row.region][row.final_status.toLowerCase()] = row.count;
  });

  return res.json({ regions: Object.values(regionMap) });
});

app.get("/dashboard/by-country", (req, res) => {
  const rows = db
    .prepare(
      `SELECT country,
              region,
              COUNT(*) as total,
              SUM(CASE WHEN final_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
              SUM(CASE WHEN final_status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
       FROM loan_applications
       GROUP BY country, region`
    )
    .all();

  return res.json({
    countries: rows.map((row) => ({
      country: row.country,
      region: row.region,
      total: row.total,
      approved: row.approved,
      rejected: row.rejected
    }))
  });
});

app.get("/dashboard/verification-stats", (req, res) => {
  const counts = (column) =>
    db
      .prepare(
        `SELECT
           SUM(CASE WHEN ${column} = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
           SUM(CASE WHEN ${column} = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
         FROM loan_applications`
      )
      .get();

  const kyc = counts("kyc_status");
  const compliance = counts("compliance_status");
  const eligibility = counts("eligibility_status");

  const extras = db
    .prepare(
      `SELECT
        SUM(political_connection) as political_connections,
        SUM(senior_relative) as senior_relatives
       FROM loan_applications`
    )
    .get();

  const passRate = (approved, rejected) => {
    const total = approved + rejected;
    return total > 0 ? Number(((approved / total) * 100).toFixed(2)) : 0;
  };

  return res.json({
    kyc: {
      approved: kyc.approved,
      rejected: kyc.rejected,
      pass_rate: passRate(kyc.approved, kyc.rejected)
    },
    compliance: {
      approved: compliance.approved,
      rejected: compliance.rejected,
      pass_rate: passRate(compliance.approved, compliance.rejected),
      political_connections: extras.political_connections || 0,
      senior_relatives: extras.senior_relatives || 0
    },
    eligibility: {
      approved: eligibility.approved,
      rejected: eligibility.rejected,
      pass_rate: passRate(eligibility.approved, eligibility.rejected)
    }
  });
});

app.get("/dashboard/financial-metrics", (req, res) => {
  const row = db
    .prepare(
      `SELECT
         AVG(credit_score) AS avg_credit_score,
         AVG(dti_ratio) AS avg_dti,
         AVG(loan_amount) AS avg_loan_amount,
         SUM(loan_amount) AS total_loan_amount,
         AVG(income) AS avg_income
       FROM loan_applications
       WHERE final_status = 'APPROVED'`
    )
    .get();

  const format = (value, precision = 2) =>
    value != null ? Number(Number(value).toFixed(precision)) : 0;

  return res.json({
    average_credit_score: format(row.avg_credit_score),
    average_dti_ratio: format(row.avg_dti, 3),
    average_loan_amount: format(row.avg_loan_amount),
    total_loan_amount: format(row.total_loan_amount),
    average_income: format(row.avg_income)
  });
});

app.get("/dashboard/timeline", (req, res) => {
  const days = Number(req.query.days) || 30;
  const rows = db
    .prepare(
      `SELECT DATE(created_at) AS date,
              COUNT(*) AS total,
              SUM(CASE WHEN final_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
              SUM(CASE WHEN final_status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
       FROM loan_applications
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) DESC
       LIMIT ?`
    )
    .all(days);

  return res.json({
    timeline: rows.map((row) => ({
      date: row.date,
      total: row.total,
      approved: row.approved,
      rejected: row.rejected
    }))
  });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const bootstrap = () => {
  if (useInMemoryDb) {
    console.log("[DB] Using in-memory mode. Seeding baseline data...");
    seedStocks();
    const loanSeedCount = Number(process.env.IN_MEMORY_LOAN_COUNT) || 25;
    seedLoanApplications(loanSeedCount);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
};

bootstrap();
