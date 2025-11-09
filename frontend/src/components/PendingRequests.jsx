import { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  approveLoanApplication,
  fetchPendingRequests,
  rejectLoanApplication,
} from "../api";
import { getStatusChipStyles, getModelVerdictStyles } from "../utils/statusStyles";

const STAGES = [
  { key: "eligibility_status", label: "Eligibility" },
  { key: "kyc_status", label: "KYC" },
  { key: "compliance_status", label: "Compliance" },
];

const nextStageFor = (request) =>
  STAGES.find((stage) => (request[stage.key] || "PENDING") !== "APPROVED");

const formatCurrency = (value) =>
  value != null ? `$${Number(value).toLocaleString()}` : "—";

const formatPercent = (value) =>
  value != null ? `${(Number(value) * 100).toFixed(1)}%` : "—";

const parseDocuments = (docs) => {
  if (!docs) return [];
  if (Array.isArray(docs)) return docs;
  try {
    const parsed = JSON.parse(docs);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return typeof docs === "string" ? [docs] : [];
  }
};

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioning, setActioning] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchPendingRequests();
      setRequests(response.data.applications || []);
    } catch (err) {
      console.error("Failed to load pending requests", err);
      setError(err.response?.data?.error || "Unable to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("goldmanUser");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse user", err);
      }
    }
    loadRequests();
  }, []);

  const handleAction = async (id, type) => {
    setActioning(`${type}-${id}`);
    setError(null);
    try {
      const actor = currentUser
        ? { email: currentUser.email, role: currentUser.role }
        : undefined;
      if (type === "approve") {
        await approveLoanApplication(id, actor);
      } else {
        await rejectLoanApplication(id, undefined, actor);
      }
      await loadRequests();
    } catch (err) {
      console.error(`Failed to ${type} application`, err);
      setError(
        err.response?.data?.error ||
          `Unable to ${type} application. Please try again.`
      );
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="min-h-screen lg:flex bg-[var(--color-navy)] text-[var(--color-text)]">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-sky)]">
            Manual Review
          </p>
          <h1 className="text-4xl font-semibold">Pending Requests</h1>
          <p className="text-[var(--color-text)]">
            Approve or reject new submissions before they enter automated
            underwriting.
          </p>
        </header>

        {error && (
          <div className="p-4 rounded-2xl border border-red-400/40 bg-red-900/30 text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[var(--color-blue)]" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 rounded-3xl border border-[var(--color-blue)]/20 bg-[var(--color-charcoal)] text-center text-[var(--color-text)]">
            No pending applications. All caught up!
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const nextStage = nextStageFor(request);
              return (
                <div
                  key={request.application_id}
                  className="rounded-3xl border border-[var(--color-blue)]/20 bg-[var(--color-charcoal)]/80 p-6 space-y-4 hover:border-[var(--color-blue)] transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-sky)]">
                        {request.application_id}
                      </p>
                      <h3 className="text-2xl font-semibold">{request.name}</h3>
                      <p className="text-sm text-[var(--color-text)]">
                        {request.region} · {request.country}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={actioning === `reject-${request.application_id}`}
                        onClick={() => handleAction(request.application_id, "reject")}
                        className="px-5 py-2 rounded-2xl border border-[var(--color-blue)]/30 hover:border-[var(--color-border-strong)] transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={
                          !nextStage || actioning === `approve-${request.application_id}`
                        }
                        onClick={() => handleAction(request.application_id, "approve")}
                        className="px-5 py-2 rounded-2xl bg-[var(--color-blue)] text-[var(--color-on-blue)] shadow-lg shadow-[var(--color-blue)]/30 hover:bg-[var(--color-gray)] transition disabled:opacity-50"
                      >
                        {nextStage ? `Approve ${nextStage.label}` : "Fully Approved"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {STAGES.map((stage) => {
                      const tone = getStatusChipStyles(request[stage.key]);
                      return (
                        <span
                          key={`${request.application_id}-${stage.key}`}
                          className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide border"
                          style={tone.style}
                        >
                          {stage.label}: {tone.label}
                        </span>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-[var(--color-text)]">
                    <div>
                      <p className="text-[var(--color-sky)] text-xs uppercase">Loan amount</p>
                      <p>{formatCurrency(request.loan_amount)}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-sky)] text-xs uppercase">Credit score</p>
                      <p>{request.credit_score}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRequest(request)}
                    className="w-full mt-4 rounded-2xl border border-[var(--color-blue)]/30 px-4 py-2 text-sm tracking-wide uppercase text-[var(--color-sky)] hover:border-[var(--color-blue)] transition"
                  >
                    View details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedRequest && (
        <DetailPanel
          request={selectedRequest}
          actioning={actioning}
          onReject={() => handleAction(selectedRequest.application_id, "reject")}
          onApprove={() => handleAction(selectedRequest.application_id, "approve")}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}

function DetailPanel({ request, actioning, onApprove, onReject, onClose }) {
  const nextStage = request ? nextStageFor(request) : null;

  const verdictStyles = useMemo(() => {
    if (!request) return null;
    return getModelVerdictStyles(request.model_decision);
  }, [request]);

  const documents = useMemo(
    () => (request ? parseDocuments(request.document_list) : []),
    [request]
  );

  const dti =
    request.income && Number(request.income) > 0
      ? Number(request.debt || 0) / Number(request.income)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-3xl border border-[var(--color-blue)]/25 bg-[var(--color-charcoal)] p-6 space-y-6 shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-[var(--color-border-medium)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--color-sky)] hover:border-[var(--color-blue)]"
        >
          Close
        </button>

        <div className="flex flex-col gap-3 pt-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--color-sky)]">
              Loan summary
            </p>
            <h2 className="text-3xl font-semibold">{request.application_id}</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {STAGES.map((stage) => {
              const tone = getStatusChipStyles(request[stage.key]);
              return (
                <span
                  key={`${request.application_id}-detail-${stage.key}`}
                  className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide border"
                  style={tone.style}
                >
                  {stage.label}: {tone.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="rounded-2xl border border-[var(--color-border-medium)] p-4">
            <p className="text-xs uppercase text-[var(--color-sky)] tracking-[0.3em]">
              Applicant
            </p>
            <p className="mt-2 text-lg font-semibold">{request.name}</p>
            <p>{request.email}</p>
            <p className="text-xs text-[var(--color-gray)] mt-1">
              {request.region} · {request.country}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-medium)] p-4">
            <p className="text-xs uppercase text-[var(--color-sky)] tracking-[0.3em]">
              Submitted
            </p>
            <p className="mt-2 text-lg font-semibold">
              {request.submitted_at
                ? new Date(request.submitted_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—"}
            </p>
            <p className="text-xs text-[var(--color-gray)]">
              Updated {request.updated_at ? new Date(request.updated_at).toLocaleString() : "—"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-border-medium)] p-4 space-y-3">
            <p className="text-xs uppercase text-[var(--color-sky)] tracking-[0.3em]">
              Financial snapshot
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Income" value={formatCurrency(request.income)} />
              <Metric label="Debt" value={formatCurrency(request.debt)} />
              <Metric label="Loan amount" value={formatCurrency(request.loan_amount)} />
              <Metric label="Credit score" value={request.credit_score || "—"} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Debt-to-income" value={formatPercent(dti)} />
              <Metric label="Purpose" value={request.loan_purpose || "—"} />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border-medium)] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-[var(--color-sky)] tracking-[0.3em]">
                Model verdict
              </p>
              {verdictStyles && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide border"
                  style={verdictStyles.badge}
                >
                  {(request.model_decision || "MODEL_REVIEW")
                    .replace("MODEL_", "")
                    .toUpperCase()}
                </span>
              )}
            </div>
            {request.model_score != null && verdictStyles && (
              <div>
                <div className="flex justify-between text-[11px] uppercase">
                  <span>Confidence</span>
                  <span>{(Number(request.model_score) * 100).toFixed(1)}%</span>
                </div>
                <div
                  className="mt-1 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--color-blue-softer)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, Number(request.model_score) * 100)
                      )}%`,
                      backgroundColor: verdictStyles.barColor,
                    }}
                  />
                </div>
              </div>
            )}
            <p className="text-sm text-[var(--color-text)]/80">
              {(request.model_reason && request.model_reason) ||
                "Review the model signal and supporting documents before finalizing the stage."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-medium)] p-4 space-y-3">
          <p className="text-xs uppercase text-[var(--color-sky)] tracking-[0.3em]">
            Documents
          </p>
          {documents.length ? (
            <ul className="space-y-2 text-sm">
              {documents.map((doc, index) => (
                <li
                  key={`${request.application_id}-doc-${index}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border-soft)] px-3 py-2"
                >
                  <span>{doc.title || doc}</span>
                  {doc.type && (
                    <span className="text-xs uppercase tracking-wide text-[var(--color-sky)]">
                      {doc.type}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-sky)]">No documents uploaded.</p>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border-medium)] p-4 space-y-3">
          <p className="text-xs uppercase text-[var(--color-sky)] tracking-[0.3em]">
            Analyst action
          </p>
          <p className="text-sm text-[var(--color-text)]/80">
            {nextStage
              ? `Advance the ${nextStage.label} checkpoint or reject if it fails policy.`
              : "All stages cleared. Finalize the approval to release funds."}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={actioning === `reject-${request.application_id}`}
              onClick={onReject}
              className="px-5 py-2 rounded-2xl border border-[var(--color-blue)]/30 hover:border-[var(--color-border-strong)] transition disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={!nextStage || actioning === `approve-${request.application_id}`}
              onClick={onApprove}
              className="px-5 py-2 rounded-2xl bg-[var(--color-blue)] text-[var(--color-on-blue)] shadow-lg shadow-[var(--color-blue)]/30 hover:bg-[var(--color-gray)] transition disabled:opacity-50"
            >
              {nextStage ? `Approve ${nextStage.label}` : "Fully Approved"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[var(--color-sky)] text-xs uppercase">{label}</p>
      <p className="font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
