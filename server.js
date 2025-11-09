import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
  createApprovalLog,
  createNotification,
  fetchNotificationsForRole,
  markNotificationsRead,
  fetchUsersByRole,
  fetchBankAccountsByEmail,
  createBankAccount,
  getBankAccountById
} from "./loanService.js";
import { seedStocks } from "./seedData.js";
import { seedLoanApplications } from "./seedLoanData.js";
import { query } from "./db.js";

const PORT = process.env.PORT || 5003;
const JWT_SECRET = process.env.JWT_SECRET || "dev-goldman-secret";
const MODEL_ENDPOINT = process.env.MODEL_ENDPOINT || "";
const MODEL_TIMEOUT_MS = Number(process.env.MODEL_TIMEOUT_MS || 4000);
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
const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "4h" }
  );

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const actorFromRequest = (req) => {
  const actor = req.body?.actor || {};
  return {
    email: actor.email || req.user?.email || null,
    role: actor.role || req.user?.role || null
  };
};

const clamp01 = (value) => {
  if (!Number.isFinite(value)) return null;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const normalizeModelScore = (raw) => {
  if (raw == null) return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  if (num > 1) {
    if (num <= 100) {
      return clamp01(num / 100);
    }
    return clamp01(num);
  }
  return clamp01(num);
};

const fallbackModelInference = (payload) => {
  const income = Number(payload.income) || 0;
  const debt = Number(payload.debt) || 0;
  const creditScore = Number(payload.credit_score) || 0;
  const dti = income > 0 ? debt / income : 1;
  const normalizedCredit = clamp01((creditScore - 300) / 550) ?? 0;
  const normalizedDti = clamp01(1 - dti) ?? 0;
  const rawScore =
    0.7 * normalizedCredit + 0.3 * normalizedDti;
  const score = clamp01(Number(rawScore.toFixed(4)));
  const decision =
    score >= 0.65
      ? "MODEL_APPROVE"
      : score >= 0.45
      ? "MODEL_REVIEW"
      : "MODEL_REJECT";
  return { score, decision, source: "fallback" };
};

const callModelEndpoint = async (payload) => {
  if (!MODEL_ENDPOINT) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
    const response = await fetch(MODEL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) {
      console.warn(
        "[Model] Non-success response",
        response.status,
        await response.text()
      );
      return null;
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn("[Model] Failed to call inference service", err.message);
    return null;
  }
};

const extractModelInsights = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const scoreCandidateKeys = [
    "score",
    "probability",
    "confidence",
    "approval_probability",
    "prediction_score"
  ];
  let score = null;
  for (const key of scoreCandidateKeys) {
    if (raw[key] != null) {
      score = normalizeModelScore(raw[key]);
      if (score != null) break;
    }
  }
  if (score == null && typeof raw.prediction === "number") {
    score = normalizeModelScore(raw.prediction);
  }
  let decision =
    raw.decision ||
    raw.prediction_label ||
    raw.label ||
    (typeof raw.prediction === "string" ? raw.prediction : null);
  if (!decision && typeof raw.approved !== "undefined") {
    decision = raw.approved ? "MODEL_APPROVE" : "MODEL_REJECT";
  }
  if (!decision && score != null) {
    decision =
      score >= 0.65
        ? "MODEL_APPROVE"
        : score >= 0.45
        ? "MODEL_REVIEW"
        : "MODEL_REJECT";
  }
  return { score, decision, source: "remote" };
};

const evaluateWithModel = async (payload) => {
  const remote = await callModelEndpoint(payload);
  if (remote) {
    const insights = extractModelInsights(remote);
    if (insights) return insights;
  }
  return fallbackModelInference(payload);
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
    const { rows } = await query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashed, role]
    );

    const user = rows[0];
    const token = signToken(user);

    return res.status(201).json({
      message: "User registered successfully",
      user,
      token
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

    const token = signToken(user);

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "CLIENT"
      },
      token
    });
  })
);

app.use(authenticate);

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
    if (req.user) {
      data.email = data.email || req.user.email;
      data.name = data.name || req.user.name;
    }
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

    if (data.bank_account_id) {
      const account = await getBankAccountById(Number(data.bank_account_id));
      if (!account || account.owner_email !== data.email) {
        return res
          .status(400)
          .json({ error: "Invalid bank account selected for this user" });
      }
      data.bank_account_id = Number(data.bank_account_id);
    }

    const modelPayload = {
      income: Number(data.income),
      debt: Number(data.debt),
      credit_score: Number(data.credit_score),
      loan_amount: Number(data.loan_amount),
      loan_purpose: data.loan_purpose,
      region: data.region,
      country: data.country,
      documents_uploaded: Boolean(data.documents_uploaded),
      dti_ratio:
        Number(data.income) > 0
          ? Number(data.debt) / Number(data.income)
          : 1
    };

    const modelInsights = await evaluateWithModel(modelPayload);
    if (modelInsights) {
      data.model_score = modelInsights.score;
      data.model_decision = modelInsights.decision;
    }

    const application = await createLoanApplication(data);

    const vendorEmails = await fetchUsersByRole("VENDOR");
    await Promise.all(
      vendorEmails.map((email) =>
        createNotification({
          recipientEmail: email,
          role: "VENDOR",
          applicationId: application.application_id,
          message: `New loan from ${application.name} awaiting review`
        })
      )
    );

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
    const requester = req.user;
    const canViewAny = requester?.role === "ADMIN";
    const targetEmail = canViewAny && email ? email : requester?.email;

    if (!targetEmail) {
      return res.status(400).json({ error: "Email is required" });
    }
    const { rows } = await query(
      `SELECT * FROM loan_applications
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [targetEmail, Number(limit)]
    );
    return res.json({
      applications: rows.map(mapLoanRow)
    });
  })
);

app.get(
  "/bank-accounts",
  asyncHandler(async (req, res) => {
    const { email } = req.query;
    const requester = req.user;
    const canViewAny = requester?.role === "ADMIN";
    const targetEmail = canViewAny && email ? email : requester?.email;

    if (!targetEmail) {
      return res.status(400).json({ error: "Email is required" });
    }
    const accounts = await fetchBankAccountsByEmail(targetEmail);
    res.json({ accounts });
  })
);

app.post(
  "/bank-accounts",
  asyncHandler(async (req, res) => {
    const {
      owner_email,
      bank_name,
      account_type,
      purpose,
      legal_name,
      dob,
      ssn,
      residential_address,
      mailing_address,
      email,
      phone,
      citizen_status,
      employed,
      annual_income,
      balance
    } = req.body || {};

    if (
      !bank_name ||
      !account_type ||
      !purpose ||
      !legal_name ||
      !dob ||
      !ssn ||
      !residential_address ||
      !email ||
      !phone ||
      !citizen_status ||
      typeof employed === "undefined" ||
      annual_income == null
    ) {
      return res.status(400).json({ error: "Missing account fields" });
    }

    const requester = req.user;
    const ownerEmail =
      (requester?.role === "ADMIN" && owner_email) || requester?.email || owner_email;

    if (!ownerEmail) {
      return res.status(400).json({ error: "Owner email missing" });
    }

    const account = await createBankAccount({
      owner_email: ownerEmail,
      bank_name,
      account_type,
      purpose,
      legal_name,
      dob,
      ssn,
      residential_address,
      mailing_address,
      email,
      phone,
      citizen_status,
      employed,
      annual_income,
      balance: Number(balance) || 0
    });

    res.status(201).json({ message: "Account added successfully", account });
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

    await createNotification({
      recipientEmail: application.email,
      role: "CLIENT",
      applicationId,
      message: `${nextStage.label} stage approved for ${applicationId}`
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
      await createNotification({
        recipientEmail: application.email,
        role: "CLIENT",
        applicationId,
        message: `Your loan ${applicationId} was approved.`
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
    const nowIso = new Date().toISOString();
    const stageUpdates = nextStage
      ? {
          [nextStage.key]: "REJECTED",
          [nextStage.verifiedField]: nowIso,
          [nextStage.remarksField]: finalRemarks
        }
      : {};
    await updateLoanApplicationById(application.id, {
      final_status: "REJECTED",
      final_remarks: finalRemarks,
      final_decision_at: nowIso,
      review_status: "REJECTED",
      ...stageUpdates
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
    await createNotification({
      recipientEmail: application.email,
      role: "CLIENT",
      applicationId,
      message: `Your loan ${applicationId} was rejected: ${finalRemarks}`
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

app.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const { email, role } = req.query;
    const effectiveEmail = email || req.user?.email;
    const effectiveRole = role || req.user?.role;
    if (!effectiveEmail || !effectiveRole) {
      return res.status(400).json({ error: "Email and role are required" });
    }
    const notifications = await fetchNotificationsForRole({
      email: effectiveEmail,
      role: effectiveRole
    });
    res.json({ notifications });
  })
);

app.post(
  "/notifications/read",
  asyncHandler(async (req, res) => {
    const ids = req.body?.ids || [];
    await markNotificationsRead({ ids });
    res.json({ success: true });
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
