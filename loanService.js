import { query } from "./db.js";
import { v4 as uuidv4 } from "uuid";

const boolFields = [
  "documents_uploaded",
  "political_connection",
  "senior_relative",
  "alert_sent",
  "email_sent"
];

const isoFields = [
  "kyc_verified_at",
  "compliance_verified_at",
  "eligibility_verified_at",
  "final_decision_at",
  "created_at",
  "updated_at"
];

const numericFields = ["income", "debt", "loan_amount", "dti_ratio"];

const defaultDocuments = [
  "ID_Proof",
  "Income_Statement",
  "Address_Proof",
  "Bank_Statement"
];

const formatIdDate = (date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;

export const mapLoanRow = (row) => {
  if (!row) return null;
  const mapped = { ...row };

  boolFields.forEach((field) => {
    if (field in mapped) {
      mapped[field] = Boolean(mapped[field]);
    }
  });

  isoFields.forEach((field) => {
    if (mapped[field]) {
      mapped[field] = new Date(mapped[field]).toISOString();
    }
  });

  numericFields.forEach((field) => {
    if (mapped[field] != null) {
      mapped[field] = Number(mapped[field]);
    }
  });

  if (mapped.document_list) {
    try {
      mapped.document_list = JSON.parse(mapped.document_list);
    } catch {
      mapped.document_list = [];
    }
  } else {
    mapped.document_list = [];
  }

  return mapped;
};

export const getLoanApplicationRow = async (applicationId) => {
  const { rows } = await query(
    "SELECT * FROM loan_applications WHERE application_id = $1",
    [applicationId]
  );
  return rows[0] || null;
};

export const getLoanApplicationByApplicationId = async (applicationId) =>
  mapLoanRow(await getLoanApplicationRow(applicationId));

export const createLoanApplication = async (payload) => {
  const now = new Date();
  const applicationId =
    payload.application_id ||
    `LOAN-${formatIdDate(now)}-${uuidv4().slice(0, 8).toUpperCase()}`;

  const documents =
    payload.documents && payload.documents.length
      ? payload.documents
      : defaultDocuments;

  const { rows } = await query(
    `
    INSERT INTO loan_applications (
      application_id,
      name,
      email,
      phone,
      region,
      country,
      income,
      debt,
      credit_score,
      loan_amount,
      loan_purpose,
      documents_uploaded,
      document_list,
      review_status
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
    )
    RETURNING *
  `,
    [
      applicationId,
      payload.name,
      payload.email,
      payload.phone || "",
      payload.region.toUpperCase(),
      payload.country,
      Number(payload.income),
      Number(payload.debt),
      Number(payload.credit_score),
      Number(payload.loan_amount),
      payload.loan_purpose || "",
      payload.documents_uploaded !== false,
      JSON.stringify(documents),
      (payload.review_status || "PENDING").toUpperCase()
    ]
  );

  return mapLoanRow(rows[0]);
};

export const listLoanApplications = async ({
  status,
  region,
  reviewStatus,
  limit = 100
}) => {
  let baseQuery = "SELECT * FROM loan_applications";
  const clauses = [];
  const values = [];

  if (status) {
    values.push(status.toUpperCase());
    clauses.push(`final_status = $${values.length}`);
  }

  if (region) {
    values.push(region.toUpperCase());
    clauses.push(`region = $${values.length}`);
  }

  if (reviewStatus) {
    values.push(reviewStatus.toUpperCase());
    clauses.push(`review_status = $${values.length}`);
  }

  if (clauses.length) {
    baseQuery += ` WHERE ${clauses.join(" AND ")}`;
  }

  values.push(limit);
  baseQuery += ` ORDER BY created_at DESC LIMIT $${values.length}`;

  const { rows } = await query(baseQuery, values);
  return rows.map(mapLoanRow);
};

export const resetApplicationStatuses = async (applicationId) => {
  await query(
    `
    UPDATE loan_applications
    SET kyc_status = 'PENDING',
        compliance_status = 'PENDING',
        eligibility_status = 'PENDING',
        final_status = 'PENDING',
        review_status = 'PENDING',
        kyc_verified_at = NULL,
        compliance_verified_at = NULL,
        eligibility_verified_at = NULL,
        kyc_remarks = NULL,
        compliance_remarks = NULL,
        eligibility_remarks = NULL,
        final_decision_at = NULL,
        final_remarks = NULL,
        dti_ratio = NULL,
        updated_at = NOW()
    WHERE application_id = $1
  `,
    [applicationId]
  );

  return getLoanApplicationByApplicationId(applicationId);
};

export const updateLoanFinalStatus = async (id, finalStatus) => {
  await query(
    `
    UPDATE loan_applications
    SET final_status = $1,
        updated_at = NOW()
    WHERE id = $2
  `,
    [finalStatus.toUpperCase(), id]
  );
};

export const updateLoanApplicationById = async (id, fields) => {
  const entries = Object.entries(fields);
  if (!entries.length) return;

  const assignments = [];
  const values = [];

  entries.forEach(([key, value], index) => {
    assignments.push(`${key} = $${index + 1}`);
    if (boolFields.includes(key)) {
      values.push(Boolean(value));
    } else if (key === "document_list" && Array.isArray(value)) {
      values.push(JSON.stringify(value));
    } else {
      values.push(value);
    }
  });

  values.push(id);

  await query(
    `
    UPDATE loan_applications
    SET ${assignments.join(", ")},
        updated_at = NOW()
    WHERE id = $${values.length}
  `,
    values
  );
};

export const createApprovalLog = async ({
  applicationId,
  stage,
  action,
  actorEmail = null,
  actorRole = null,
  notes = null
}) => {
  await query(
    `
    INSERT INTO approval_logs
      (application_id, stage, action, actor_email, actor_role, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
  `,
    [applicationId, stage, action, actorEmail, actorRole, notes]
  );
};
