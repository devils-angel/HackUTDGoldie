import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import {
  approveLoanApplication,
  fetchPendingRequests,
  rejectLoanApplication,
} from "../api";

const STAGES = [
  { key: "kyc_status", label: "KYC" },
  { key: "compliance_status", label: "Compliance" },
  { key: "eligibility_status", label: "Eligibility" },
];

const statusTone = (value) => {
  const upper = (value || "PENDING").toUpperCase();
  if (upper === "APPROVED") return { color: "text-[#64F6A3]", label: "APPROVED" };
  if (upper === "REJECTED") return { color: "text-[#FF8FA3]", label: "REJECTED" };
  return { color: "text-[#F0BB5A]", label: upper };
};

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
    <div className="min-h-screen lg:flex bg-[#101327] text-white">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-[#A5B8D0]">
            Manual Review
          </p>
          <h1 className="text-4xl font-semibold">Pending Requests</h1>
          <p className="text-[#C3CDDA]">
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#2178C4]" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 rounded-3xl border border-white/10 bg-[#1B1F35] text-center text-[#C3CDDA]">
            No pending applications. All caught up!
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const nextStage = nextStageFor(request);
              return (
              <div
                key={request.application_id}
                className="bg-[#1B1F35] border border-white/10 rounded-3xl p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#A5B8D0]">
                      {request.application_id}
                    </p>
                    <h3 className="text-2xl font-semibold">{request.name}</h3>
                    <p className="text-sm text-[#C3CDDA]">
                      {request.region} · {request.country}
                    </p>
                  </div>
                <div className="flex gap-3">
                  <button
                      disabled={actioning === `reject-${request.application_id}`}
                      onClick={() =>
                        handleAction(request.application_id, "reject")
                      }
                      className="px-5 py-2 rounded-2xl border border-white/20 hover:border-white/60 transition disabled:opacity-50"
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
                      className="px-5 py-2 rounded-2xl bg-[#2178C4] shadow-lg shadow-[#2178C4]/30 hover:bg-[#1b63a0] transition disabled:opacity-50"
                    >
                      {nextStage
                        ? `Approve ${nextStage.label}`
                        : "Fully Approved"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {STAGES.map((stage) => {
                    const tone = statusTone(request[stage.key]);
                    return (
                      <span
                        key={`${request.application_id}-${stage.key}`}
                        className={`px-3 py-1 rounded-full border border-white/10 bg-white/5 ${tone.color}`}
                      >
                        {stage.label}: {tone.label}
                      </span>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[#C3CDDA]">
                  <div>
                    <p className="text-[#A5B8D0]">Income</p>
                    <p>${Number(request.income).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#A5B8D0]">Debt</p>
                    <p>${Number(request.debt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#A5B8D0]">Credit Score</p>
                    <p>{request.credit_score}</p>
                  </div>
                  <div>
                    <p className="text-[#A5B8D0]">Loan Amount</p>
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
