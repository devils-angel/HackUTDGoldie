import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import {
  approveLoanApplication,
  fetchPendingRequests,
  rejectLoanApplication,
} from "../api";
import { getStatusChipStyles, getModelVerdictStyles } from "../utils/statusStyles";

const STAGES = [
  { key: "kyc_status", label: "KYC" },
  { key: "compliance_status", label: "Compliance" },
  { key: "eligibility_status", label: "Eligibility" },
];

const nextStageFor = (request) =>
  STAGES.find((stage) => (request[stage.key] || "PENDING") !== "APPROVED");

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioning, setActioning] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

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
                className="bg-[var(--color-charcoal)] border border-[var(--color-blue)]/20 rounded-3xl p-6 space-y-4"
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
                      disabled={actioning === `reject-${request.application_id}`}
                      onClick={() =>
                        handleAction(request.application_id, "reject")
                      }
                      className="px-5 py-2 rounded-2xl border border-[var(--color-blue)]/30 hover:border-[var(--color-border-strong)] transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  <button
                      disabled={
                        !nextStage ||
                        actioning === `approve-${request.application_id}`
                      }
                      onClick={() =>
                        handleAction(request.application_id, "approve")
                      }
                      className="px-5 py-2 rounded-2xl bg-[var(--color-blue)] shadow-lg shadow-[var(--color-blue)]/30 hover:bg-[var(--color-gray)] transition disabled:opacity-50"
                    >
                      {nextStage
                        ? `Approve ${nextStage.label}`
                        : "Fully Approved"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
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
                {(request.model_decision || request.model_score != null) &&
                  (() => {
                    const verdictStyles = getModelVerdictStyles(
                      request.model_decision
                    );
                    return (
                      <div
                        className="text-xs mt-3 p-3 rounded-2xl border"
                        style={verdictStyles.container}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>Model insight</span>
                          <span
                            className="px-2 py-0.5 rounded-full border text-xs font-semibold tracking-wide"
                            style={verdictStyles.badge}
                          >
                            {(request.model_decision || "MODEL_REVIEW")
                              .replace("MODEL_", "")
                              .toUpperCase()}
                          </span>
                        </div>
                        {request.model_score != null && (
                          <div className="mt-2">
                            <div className="flex justify-between text-[11px] uppercase">
                              <span>Confidence</span>
                              <span>
                                {(Number(request.model_score) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div
                              className="mt-1 h-1.5 rounded-full overflow-hidden"
                              style={{ backgroundColor: "var(--color-blue-softer)" }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, Number(request.model_score) * 100)
                                  )}%`,
                                  backgroundColor: verdictStyles.barColor
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[var(--color-text)]">
                  <div>
                    <p className="text-[var(--color-sky)]">Income</p>
                    <p>${Number(request.income).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-sky)]">Debt</p>
                    <p>${Number(request.debt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-sky)]">Credit Score</p>
                    <p>{request.credit_score}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-sky)]">Loan Amount</p>
                    <p>${Number(request.loan_amount).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
