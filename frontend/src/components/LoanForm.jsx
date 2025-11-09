import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { applyForLoan, fetchUserLoans, fetchBankAccounts } from "../api";

const REGIONS = ["APAC", "EMEA", "AMERICAS", "MEA", "NA", "SA", "EU", "ASIA"];

const LOAN_PURPOSES = [
  "Home Purchase",
  "Business Expansion",
  "Education",
  "Medical Expenses",
  "Debt Consolidation",
  "Vehicle Purchase",
  "Home Renovation",
  "Working Capital",
  "Investment",
  "Emergency Funds"
];

const statusTone = (status) => {
  if (!status) return { label: "PENDING", color: "text-[#F0BB5A]" };
  const upper = status.toUpperCase();
  if (upper === "APPROVED") return { label: "APPROVED", color: "text-[#64F6A3]" };
  if (upper === "REJECTED") return { label: "REJECTED", color: "text-[#FF8FA3]" };
  return { label: upper, color: "text-[#F0BB5A]" };
};

export default function LoanForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    region: "AMERICAS",
    country: "",
    income: "",
    debt: "",
    credit_score: "",
    loan_amount: "",
    loan_purpose: "Home Purchase"
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingInfo, setPendingInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountsError, setAccountsError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const loadRequests = async (email) => {
    if (!email) return;
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const response = await fetchUserLoans(email, 50);
      setRequests(response.data.applications || []);
    } catch (err) {
      console.error("Failed to load loan requests", err);
      setRequestsError(
        err.response?.data?.error || "Unable to load your loan requests."
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadAccounts = async (email) => {
    if (!email) return;
    setAccountsError(null);
    try {
      const response = await fetchBankAccounts(email);
      const list = response.data.accounts || [];
      setAccounts(list);
      setSelectedAccount((prev) =>
        prev ? prev : list.length ? String(list[0].id) : ""
      );
    } catch (err) {
      console.error("Failed to load accounts", err);
      setAccountsError(
        err.response?.data?.error || "Unable to load bank accounts."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPendingInfo(null);

    try {
      const response = await applyForLoan({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        region: formData.region,
        country: formData.country,
        income: parseFloat(formData.income),
        debt: parseFloat(formData.debt),
        credit_score: parseInt(formData.credit_score, 10),
        loan_amount: parseFloat(formData.loan_amount),
        loan_purpose: formData.loan_purpose,
        documents_uploaded: true,
        bank_account_id: selectedAccount ? Number(selectedAccount) : undefined
      });

      setPendingInfo(response.data.application);
      const email = currentUser?.email || formData.email;
      if (email) {
        loadRequests(email);
      }
    } catch (err) {
      console.error("Error applying for loan:", err);
      setError(
        err.response?.data?.error ??
          err.message ??
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("goldmanUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setFormData((prev) => ({
          ...prev,
          name: user?.name || prev.name,
          email: user?.email || prev.email
        }));
        if (user?.email) {
          loadRequests(user.email);
          loadAccounts(user.email);
        }
      } catch (err) {
        console.error("Failed to parse stored user", err);
      }
    }
  }, []);

  const inputClasses =
    "w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white placeholder:text-[#7A82AE] focus:border-[#2178C4] focus:ring-2 focus:ring-[#2178C4]/30 outline-none transition";
  const readOnlyInputClasses = `${inputClasses} bg-[#1F2240] text-white/80 cursor-not-allowed focus:border-white/10 focus:ring-0`;
  const selectClasses = `${inputClasses} appearance-none pr-10`;
  const labelClasses = "block text-sm font-medium text-[#C3CDDA] mb-2";

  return (
    <div className="min-h-screen lg:flex bg-[#101327] text-white">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-10">
        <header className="space-y-3 text-center md:text-left">
          <p className="text-sm uppercase tracking-[0.4em] text-[#A5B8D0]">
            Goldman Credit Desk
          </p>
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
            Structure a new loan application with confidence.
          </h2>
          <p className="text-[#C3CDDA] max-w-2xl">
            Provide the borrower profile and our underwriting engine will trigger
            automated KYC, compliance, and eligibility checks once approved.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)]">
          <div className="bg-[#1B1F35] rounded-3xl border border-white/5 shadow-2xl p-8 space-y-10">
            <form onSubmit={handleSubmit} className="space-y-10">
              <section className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold">Personal Information</h3>
                  <p className="text-sm text-[#A5B8D0]">
                    Borrower details required for identity verification.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClasses}>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      placeholder="John Doe"
                      required
                      readOnly
                      className={readOnlyInputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      placeholder="john.doe@example.com"
                      required
                      readOnly
                      className={readOnlyInputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1234567890"
                      required
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Country *</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="United States"
                      required
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Region *</label>
                    <select
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      required
                      className={selectClasses}
                    >
                      {REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Linked Account</label>
                  {accountsError ? (
                    <p className="text-sm text-red-300">{accountsError}</p>
                  ) : accounts.length ? (
                    <select
                      className={selectClasses}
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bank_name} • {account.account_type} • #
                          {account.account_number}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-[#C3CDDA]">
                      No accounts linked.{" "}
                      <Link to="/accounts" className="text-[#2178C4] underline">
                        Add one
                      </Link>{" "}
                      to speed up disbursement.
                    </p>
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold">Financial Snapshot</h3>
                  <p className="text-sm text-[#A5B8D0]">
                    Used to calculate debt-to-income and exposure ratios.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClasses}>Annual Income ($) *</label>
                    <input
                      type="number"
                      name="income"
                      value={formData.income}
                      onChange={handleChange}
                      placeholder="75000"
                      min="0"
                      step="0.01"
                      required
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Total Debt ($) *</label>
                    <input
                      type="number"
                      name="debt"
                      value={formData.debt}
                      onChange={handleChange}
                      placeholder="25000"
                      min="0"
                      step="0.01"
                      required
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Credit Score *</label>
                    <input
                      type="number"
                      name="credit_score"
                      value={formData.credit_score}
                      onChange={handleChange}
                      placeholder="720"
                      min="300"
                      max="850"
                      required
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Loan Amount ($) *</label>
                    <input
                      type="number"
                      name="loan_amount"
                      value={formData.loan_amount}
                      onChange={handleChange}
                      placeholder="250000"
                      min="0"
                      step="0.01"
                      required
                      className={inputClasses}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold">Loan Structure</h3>
                  <p className="text-sm text-[#A5B8D0]">
                    Select the intended capital deployment.
                  </p>
                </div>
                <div>
                  <label className={labelClasses}>Purpose *</label>
                  <select
                    name="loan_purpose"
                    value={formData.loan_purpose}
                    onChange={handleChange}
                    required
                    className={selectClasses}
                  >
                    {LOAN_PURPOSES.map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {purpose}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2178C4] text-white rounded-2xl py-3.5 font-semibold tracking-wide shadow-lg shadow-[#2178C4]/30 hover:bg-[#1b63a0] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing application…
                  </span>
                ) : (
                  "Submit application"
                )}
              </button>
            </form>

            {error && (
              <div className="p-5 rounded-2xl border border-[#FF6B6B]/30 bg-[#3B1F2B] text-[#FFC9C9]">
                <p className="font-semibold flex items-center gap-2 text-[#FF8FA3]">
                  <span className="text-xl">⚠</span> Submission error
                </p>
                <p className="mt-2 text-sm">{error}</p>
              </div>
            )}

            {pendingInfo && (
              <div
                className={`p-6 rounded-3xl space-y-4 ${
                  pendingInfo.review_status === "REJECTED"
                    ? "border border-[#FF8FA3]/40 bg-[#2B151E]"
                    : pendingInfo.review_status === "APPROVED"
                    ? "border border-[#4ADE80]/30 bg-[#0F241B]"
                    : "border border-[#F0BB5A]/30 bg-[#2B1F0F]"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <p
                    className={`text-sm uppercase tracking-[0.3em] ${
                      pendingInfo.review_status === "REJECTED"
                        ? "text-[#FF8FA3]"
                        : pendingInfo.review_status === "APPROVED"
                        ? "text-[#64F6A3]"
                        : "text-[#F0BB5A]"
                    }`}
                  >
                    {pendingInfo.review_status === "REJECTED"
                      ? "Rejected"
                      : pendingInfo.review_status === "APPROVED"
                      ? "Fully approved"
                      : "In manual review"}
                  </p>
                  <h3 className="text-2xl font-semibold">
                    {pendingInfo.application_id}
                  </h3>
                  <p className="text-sm text-[#C3CDDA]">
                    Your request is queued for an analyst. Monitor progress below.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#A5B8D0]">Review status</p>
                    <p className="font-semibold">{pendingInfo.review_status}</p>
                  </div>
                  {pendingInfo.submitted_at && (
                    <div>
                      <p className="text-[#A5B8D0]">Submitted</p>
                      <p>
                        {new Date(pendingInfo.submitted_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-gradient-to-br from-[#1F2A4A] to-[#14183A] rounded-3xl border border-white/10 p-5 space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#2178C4] flex items-center justify-center text-lg font-semibold">
                  {(currentUser?.name || formData.name || "Client")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-[#A5B8D0] uppercase tracking-[0.3em]">
                    Signed in
                  </p>
                  <p className="text-lg font-semibold">
                    {currentUser?.name || formData.name || "Client User"}
                  </p>
                </div>
              </div>
              <div className="text-sm text-[#C3CDDA] space-y-1">
                <p>{currentUser?.email || formData.email || "—"}</p>
                <p className="text-xs text-[#7A82AE]">
                  Role: {(currentUser?.role || "Client").toUpperCase()}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-[#A5B8D0] border-t border-white/10 pt-3">
                <span>{accounts.length ? `${accounts.length} accounts linked` : "No accounts yet"}</span>
                <span className="text-[#64F6A3]">
                  {requests.length ? `${requests.length} requests` : "New applicant"}
                </span>
              </div>
            </div>
            <div className="bg-[#1B1F35] rounded-3xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#A5B8D0]">
                    My Portfolio
                  </p>
                  <h3 className="text-2xl font-semibold">Your Requests</h3>
                </div>
                <button
                  className="text-xs text-[#A5B8D0] hover:text-white"
                  onClick={() => {
                    const email = currentUser?.email || formData.email;
                    if (email) loadRequests(email);
                  }}
                >
                  Refresh
                </button>
              </div>

              {requestsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#2178C4]" />
                </div>
              ) : requestsError ? (
                <p className="text-sm text-red-300">{requestsError}</p>
              ) : requests.length === 0 ? (
                <p className="text-sm text-[#C3CDDA]">
                  You haven’t submitted any loan applications yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-2">
                  {requests.map((req) => {
                    const status =
                      req.final_status && req.final_status !== "PENDING"
                        ? req.final_status
                        : req.review_status || "PENDING";
                    const tone = statusTone(status);
                    return (
                      <div
                        key={req.application_id}
                        className="border border-white/10 rounded-2xl p-4 bg-[#14183A]"
                      >
                        <p className="text-xs uppercase tracking-[0.3em] text-[#A5B8D0]">
                          {req.application_id}
                        </p>
                        <p className="text-lg font-semibold mt-1">
                          {req.loan_purpose || "Loan Request"}
                        </p>
                        <p className="text-sm text-[#C3CDDA]">
                          ${Number(req.loan_amount).toLocaleString()}
                        </p>
                        <p className={`mt-2 text-sm font-semibold ${tone.color}`}>
                          {tone.label}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {[
                            { key: "kyc_status", label: "KYC" },
                            { key: "compliance_status", label: "Compliance" },
                            { key: "eligibility_status", label: "Eligibility" }
                          ].map((stage) => {
                            const stageTone = statusTone(req[stage.key]);
                            return (
                              <span
                                key={`${req.application_id}-${stage.key}`}
                                className={`px-3 py-1 rounded-full border border-white/10 bg-white/5 ${stageTone.color}`}
                              >
                                {stage.label}: {stageTone.label}
                              </span>
                            );
                          })}
                        </div>
                        {(req.model_decision || req.model_score != null) && (
                          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-[#1F2A4A] to-[#14183A] border border-white/10">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-[#A5B8D0]">Model verdict</span>
                              <span
                                className={`px-2 py-0.5 rounded-full ${
                                  req.model_decision === "MODEL_APPROVE"
                                    ? "bg-[#64F6A3]/20 text-[#64F6A3]"
                                    : req.model_decision === "MODEL_REJECT"
                                    ? "bg-[#FF8FA3]/20 text-[#FF8FA3]"
                                    : "bg-[#F0BB5A]/20 text-[#F0BB5A]"
                                }`}
                              >
                                {(req.model_decision || "MODEL_REVIEW")
                                  .replace("MODEL_", "")
                                  .toUpperCase()}
                              </span>
                            </div>
                            {req.model_score != null && (
                              <div className="mt-2">
                                <div className="flex justify-between text-[11px] text-[#7A82AE] uppercase">
                                  <span>Confidence</span>
                                  <span>{(Number(req.model_score) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      req.model_decision === "MODEL_APPROVE"
                                        ? "bg-[#64F6A3]"
                                        : req.model_decision === "MODEL_REJECT"
                                        ? "bg-[#FF8FA3]"
                                        : "bg-[#F0BB5A]"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(0, Number(req.model_score) * 100)
                                      )}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
