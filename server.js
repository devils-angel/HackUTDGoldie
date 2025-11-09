import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import VerificationService from "./verificationService.js";
import {
  createLoanApplication,
  getLoanApplicationByApplicationId,
  listLoanApplications,
  resetApplicationStatuses,
  getLoanApplicationRow,
  updateLoanApplicationById,
  updateLoanFinalStatus,
  mapLoanRow,
  createApprovalLog
} from "./loanService.js";
import { seedStocks } from "./seedData.js";
import { seedLoanApplications } from "./seedLoanData.js";
import { query } from "./db.js";

const PORT = process.env.PORT || 5003;
const autoSeedOnStart = process.env.AUTO_SEED === "true";
const USER_ROLES = ["ADMIN", "VENDOR", "CLIENT"];
const normalizeRole = (value) =>
  (value || "CLIENT").toString().trim().toUpperCase();
const MANUAL_STAGES = [
  {
    key: "kyc_status",
    label: "KYC",
    verifiedField: "kyc_verified_at",
    remarksField: "kyc_remarks"
  },
  {
    key: "compliance_status",
    label: "Compliance",
    verifiedField: "compliance_verified_at",
    remarksField: "compliance_remarks"
  },
  {
    key: "eligibility_status",
    label: "Eligibility",
    verifiedField: "eligibility_verified_at",
    remarksField: "eligibility_remarks"
  }
];
const actorFromRequest = (req) => {
  const actor = req.body?.actor || {};
  return {
    email: actor.email || null,
    role: actor.role || null
  };
};

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

    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 12);
    await query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
      [name, email, hashed, role]
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

    const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
    // console.log(rows);
    const user = rows[0];
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

app.get(
  "/data",
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      "SELECT id, symbol, name, last, change, percent_change, price_volume, time FROM stocks ORDER BY id ASC"
    );
    res.json(rows.map(stockMapper));
  })
);

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

    const application = await createLoanApplication(data);

    return res.status(201).json({
      message: "Loan application submitted and pending manual review",
      application: {
        application_id: application.application_id,
        review_status: application.review_status,
        submitted_at: application.created_at
      }
    });
  })
);

app.get(
  "/loan-application/status/:applicationId",
  asyncHandler(async (req, res) => {
    const application = await getLoanApplicationByApplicationId(
      req.params.applicationId
    );
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    return res.json(application);
  })
);

app.get(
  "/loan-application/list",
  asyncHandler(async (req, res) => {
    const { status, region, review_status: reviewStatus } = req.query;
    const limit = Number(req.query.limit) || 100;
    const applications = await listLoanApplications({ status, region, reviewStatus, limit });
    return res.json({ total: applications.length, applications });
  })
);

app.get(
  "/loan-application/user",
  asyncHandler(async (req, res) => {
    const { email, limit = 50 } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const { rows } = await query(
      `SELECT * FROM loan_applications
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [email, Number(limit)]
    );
    return res.json({
      applications: rows.map(mapLoanRow)
    });
  })
);

app.get(
  "/loan-application/pending",
  asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 100;
    const applications = await listLoanApplications({ reviewStatus: "PENDING", limit });
    return res.json({ total: applications.length, applications });
  })
);

app.post(
  "/loan-application/:applicationId/approve",
  asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const application = await getLoanApplicationRow(applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    if (application.review_status !== "PENDING") {
      return res.status(400).json({ error: "Application is not pending review" });
    }

    const nextStage = MANUAL_STAGES.find(
      (stage) => (application[stage.key] || "PENDING") !== "APPROVED"
    );

    if (!nextStage) {
      return res.status(400).json({ error: "Application already fully approved" });
    }

    const now = new Date().toISOString();
    const actor = actorFromRequest(req);

    await updateLoanApplicationById(application.id, {
      [nextStage.key]: "APPROVED",
      [nextStage.verifiedField]: now,
      [nextStage.remarksField]: `Manually approved on ${now}`
    });

    await createApprovalLog({
      applicationId,
      stage: nextStage.label,
      action: "STAGE_APPROVED",
      actorEmail: actor.email,
      actorRole: actor.role,
      notes: req.body?.notes || null
    });

    let message = `${nextStage.label} stage approved`;

    if (nextStage.key === "eligibility_status") {
      await updateLoanFinalStatus(application.id, "APPROVED");
      await updateLoanApplicationById(application.id, {
        final_decision_at: now,
        final_remarks: "Approved via manual eligibility review",
        review_status: "APPROVED"
      });
      await createApprovalLog({
        applicationId,
        stage: "Final Decision",
        action: "FINAL_APPROVED",
        actorEmail: actor.email,
        actorRole: actor.role,
        notes: "Eligibility approved manually"
      });
      message = "Application fully approved";
    }

    const updated = await getLoanApplicationByApplicationId(applicationId);
    return res.json({
      message,
      application: updated
    });
  })
);

app.post(
  "/loan-application/:applicationId/reject",
  asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { reason } = req.body || {};
    const application = await getLoanApplicationRow(applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    if (application.review_status !== "PENDING") {
      return res.status(400).json({ error: "Application is not pending review" });
    }

    const actor = actorFromRequest(req);
    const nextStage = MANUAL_STAGES.find(
      (stage) => (application[stage.key] || "PENDING") !== "APPROVED"
    );
    const finalRemarks = reason?.trim()
      ? reason.trim()
      : "Application rejected during manual review";
    await updateLoanApplicationById(application.id, {
      final_status: "REJECTED",
      final_remarks: finalRemarks,
      final_decision_at: new Date().toISOString(),
      review_status: "REJECTED"
    });

    const updated = await getLoanApplicationByApplicationId(applicationId);
    await createApprovalLog({
      applicationId,
      stage: nextStage?.label || "Manual Review",
      action: "REJECTED",
      actorEmail: actor.email,
      actorRole: actor.role,
      notes: finalRemarks
    });
    await VerificationService.sendNotification(updated);

    return res.json({
      message: "Application rejected",
      application: updated
    });
  })
);

app.post(
  "/loan-application/reprocess/:applicationId",
  asyncHandler(async (req, res) => {
    const application = await getLoanApplicationRow(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    await resetApplicationStatuses(req.params.applicationId);
    await VerificationService.processApplication(req.params.applicationId);
    const refreshed = await getLoanApplicationByApplicationId(req.params.applicationId);

    return res.json({
      message: "Application reprocessed successfully",
      application: refreshed
    });
  })
);

app.get(
  "/dashboard/overview",
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT
        (SELECT COUNT(*) FROM loan_applications) AS total,
        (SELECT COUNT(*) FROM loan_applications WHERE final_status = 'APPROVED') AS approved,
        (SELECT COUNT(*) FROM loan_applications WHERE final_status = 'REJECTED') AS rejected,
        (SELECT COUNT(*) FROM loan_applications WHERE final_status = 'PENDING') AS pending`
    );
    const stats = rows[0];
    const approvalRate =
      stats.total > 0 ? Number(((stats.approved / stats.total) * 100).toFixed(2)) : 0;

    return res.json({
      total_applications: Number(stats.total),
      approved: Number(stats.approved),
      rejected: Number(stats.rejected),
      pending: Number(stats.pending),
      approval_rate: approvalRate
    });
  })
);

app.get(
  "/dashboard/by-region",
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT region, final_status, COUNT(*) as count
       FROM loan_applications
       GROUP BY region, final_status`
    );

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
      regionMap[row.region].total += Number(row.count);
      regionMap[row.region][row.final_status.toLowerCase()] = Number(row.count);
    });

    return res.json({ regions: Object.values(regionMap) });
  })
);

app.get(
  "/dashboard/by-country",
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT country,
              region,
              COUNT(*) as total,
              SUM(CASE WHEN final_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
              SUM(CASE WHEN final_status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
       FROM loan_applications
       GROUP BY country, region`
    );

    return res.json({
      countries: rows.map((row) => ({
        country: row.country,
        region: row.region,
        total: Number(row.total),
        approved: Number(row.approved),
        rejected: Number(row.rejected)
      }))
    });
  })
);

app.get(
  "/dashboard/verification-stats",
  asyncHandler(async (req, res) => {
    const counts = async (column) => {
      const { rows } = await query(
        `SELECT
           SUM(CASE WHEN ${column} = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
           SUM(CASE WHEN ${column} = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
         FROM loan_applications`
      );
      return {
        approved: Number(rows[0].approved || 0),
        rejected: Number(rows[0].rejected || 0)
      };
    };

    const kyc = await counts("kyc_status");
    const compliance = await counts("compliance_status");
    const eligibility = await counts("eligibility_status");

    const { rows: extrasRows } = await query(
      `SELECT
        SUM(CASE WHEN political_connection THEN 1 ELSE 0 END) as political_connections,
        SUM(CASE WHEN senior_relative THEN 1 ELSE 0 END) as senior_relatives
       FROM loan_applications`
    );
    const extras = extrasRows[0];

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
        political_connections: Number(extras.political_connections || 0),
        senior_relatives: Number(extras.senior_relatives || 0)
      },
      eligibility: {
        approved: eligibility.approved,
        rejected: eligibility.rejected,
        pass_rate: passRate(eligibility.approved, eligibility.rejected)
      }
    });
  })
);

app.get(
  "/dashboard/financial-metrics",
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT
         AVG(credit_score) AS avg_credit_score,
         AVG(dti_ratio) AS avg_dti,
         AVG(loan_amount) AS avg_loan_amount,
         SUM(loan_amount) AS total_loan_amount,
         AVG(income) AS avg_income
       FROM loan_applications
       WHERE final_status = 'APPROVED'`
    );
    const row = rows[0];

    const format = (value, precision = 2) =>
      value != null ? Number(Number(value).toFixed(precision)) : 0;

    return res.json({
      average_credit_score: format(row.avg_credit_score),
      average_dti_ratio: format(row.avg_dti, 3),
      average_loan_amount: format(row.avg_loan_amount),
      total_loan_amount: format(row.total_loan_amount),
      average_income: format(row.avg_income)
    });
  })
);

app.get(
  "/dashboard/timeline",
  asyncHandler(async (req, res) => {
    const days = Number(req.query.days) || 30;
    const { rows } = await query(
      `SELECT DATE(created_at) AS date,
              COUNT(*) AS total,
              SUM(CASE WHEN final_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
              SUM(CASE WHEN final_status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
       FROM loan_applications
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) DESC
       LIMIT $1`,
      [days]
    );

    return res.json({
      timeline: rows.map((row) => ({
        date: row.date,
        total: Number(row.total),
        approved: Number(row.approved),
        rejected: Number(row.rejected)
      }))
    });
  })
);

app.get(
  "/approval-logs",
  asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 200;
    const applicationId = req.query.application_id;
    const clauses = [];
    const values = [];
    if (applicationId) {
      clauses.push(`application_id = $${values.length + 1}`);
      values.push(applicationId);
    }
    values.push(limit);
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const { rows } = await query(
      `SELECT * FROM approval_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length}`,
      values
    );
    res.json({ logs: rows });
  })
);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const startServer = async () => {
  if (autoSeedOnStart) {
    console.log("[DB] Auto seeding enabled. Populating baseline data...");
    await seedStocks({ silent: true });
    const loanSeedCount = Number(process.env.IN_MEMORY_LOAN_COUNT) || 25;
    await seedLoanApplications(loanSeedCount, { silent: true });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
};

startServer();
