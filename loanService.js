import { v4 as uuidv4 } from "uuid";
import db from "./db.js";

const BOOL_FIELDS = [
  "documents_uploaded",
  "political_connection",
  "senior_relative",
  "alert_sent",
  "email_sent"
];

const ISO_FIELDS = [
  "kyc_verified_at",
  "compliance_verified_at",
  "eligibility_verified_at",
  "final_decision_at",
  "created_at",
  "updated_at"
];

const DEFAULT_DOCUMENTS = [
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
  BOOL_FIELDS.forEach((field) => {
    if (field in mapped) {
      mapped[field] = Boolean(mapped[field]);
    }
  });

  ISO_FIELDS.forEach((field) => {
    if (mapped[field]) {
      const value = mapped[field];
      mapped[field] = value.includes("Z")
        ? value
        : new Date(value).toISOString();
    }
  });

  return mapped;
};

export const getLoanApplicationRow = (applicationId) =>
  db
    .prepare("SELECT * FROM loan_applications WHERE application_id = ?")
    .get(applicationId);

export const getLoanApplicationByApplicationId = (applicationId) =>
  mapLoanRow(getLoanApplicationRow(applicationId));

export const updateLoanApplicationById = (id, fields) => {
  if (!fields || !Object.keys(fields).length) return;

  const payload = { ...fields };
  BOOL_FIELDS.forEach((field) => {
    if (field in payload) {
      payload[field] = payload[field] ? 1 : 0;
    }
  });

  const assignments = Object.keys(payload).map((key) => `${key} = @${key}`);
  const stmt = db.prepare(
    `UPDATE loan_applications
     SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE id = @id`
  );
  stmt.run({ ...payload, id });
};

export const createLoanApplication = (payload) => {
  const now = new Date();
  const applicationId =
    payload.application_id ||
    `LOAN-${formatIdDate(now)}-${uuidv4().slice(0, 8).toUpperCase()}`;

  const createdAt = payload.created_at || now.toISOString();
  const documents =
    payload.documents && payload.documents.length
      ? payload.documents
      : DEFAULT_DOCUMENTS;

  const insert = db.prepare(
    `INSERT INTO loan_applications (
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
      created_at,
      updated_at
    ) VALUES (
      @application_id,
      @name,
      @email,
      @phone,
      @region,
      @country,
      @income,
      @debt,
      @credit_score,
      @loan_amount,
      @loan_purpose,
      @documents_uploaded,
      @document_list,
      @created_at,
      @updated_at
    )`
  );

  insert.run({
    application_id: applicationId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "",
    region: payload.region.toUpperCase(),
    country: payload.country,
    income: Number(payload.income),
    debt: Number(payload.debt),
    credit_score: Number(payload.credit_score),
    loan_amount: Number(payload.loan_amount),
    loan_purpose: payload.loan_purpose || "",
    documents_uploaded: payload.documents_uploaded === false ? 0 : 1,
    document_list: JSON.stringify(documents),
    created_at: createdAt,
    updated_at: createdAt
  });

  return getLoanApplicationByApplicationId(applicationId);
};

export const listLoanApplications = ({ status, region, limit = 100 }) => {
  let query = "SELECT * FROM loan_applications";
  const clauses = [];
  const params = {};

  if (status) {
    clauses.push("final_status = @status");
    params.status = status.toUpperCase();
  }

  if (region) {
    clauses.push("region = @region");
    params.region = region.toUpperCase();
  }

  if (clauses.length) {
    query += ` WHERE ${clauses.join(" AND ")}`;
  }

  query += " ORDER BY datetime(created_at) DESC LIMIT @limit";
  params.limit = limit;

  const rows = db.prepare(query).all(params);
  return rows.map(mapLoanRow);
};

export const resetApplicationStatuses = (applicationId) => {
  const stmt = db.prepare(
    `UPDATE loan_applications
     SET kyc_status = 'PENDING',
         compliance_status = 'PENDING',
         eligibility_status = 'PENDING',
         final_status = 'PENDING',
         kyc_verified_at = NULL,
         compliance_verified_at = NULL,
         eligibility_verified_at = NULL,
         kyc_remarks = NULL,
         compliance_remarks = NULL,
         eligibility_remarks = NULL,
         final_decision_at = NULL,
         final_remarks = NULL,
         dti_ratio = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE application_id = ?`
  );

  stmt.run(applicationId);
  return getLoanApplicationByApplicationId(applicationId);
};
