import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { applyForLoan, fetchUserLoans } from "../api";

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
        documents_uploaded: true
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
        }
      } catch (err) {
        console.error("Failed to parse stored user", err);
      }
    }
  }, []);

  const inputClasses =
    "w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white placeholder:text-[#7A82AE] focus:border-[#2178C4] focus:ring-2 focus:ring-[#2178C4]/30 outline-none transition";
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
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john.doe@example.com"
                      required
                      className={inputClasses}
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
              <div className="p-6 rounded-3xl border border-[#4ADE80]/30 bg-[#0F241B] space-y-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm uppercase tracking-[0.3em] text-[#64F6A3]">
                    In manual review
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
