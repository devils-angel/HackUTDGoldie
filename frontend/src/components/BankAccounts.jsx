import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { fetchBankAccounts, addBankAccount } from "../api";

const ACCOUNT_TYPES = [
  { label: "Checking", value: "CHECKING" },
  { label: "Savings", value: "SAVINGS" },
  { label: "Student", value: "STUDENT" },
  { label: "Business", value: "BUSINESS" }
];

const ACCOUNT_PURPOSES = [
  { label: "Personal use", value: "PERSONAL_USE" },
  { label: "Direct deposit", value: "DIRECT_DEPOSIT" },
  { label: "Saving goals", value: "SAVING_GOALS" },
  { label: "Business operations", value: "BUSINESS_OPERATIONS" }
];

const initialFormState = {
  bank_name: "",
  account_type: ACCOUNT_TYPES[0].value,
  purpose: ACCOUNT_PURPOSES[0].value,
  legal_name: "",
  dob: "",
  ssn: "",
  residential_address: "",
  mailing_address: "",
  email: "",
  phone: "",
  citizen_status: "",
  employed: "yes",
  annual_income: "",
  balance: ""
};

export default function BankAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadAccounts = async (profile) => {
    if (!profile?.email) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchBankAccounts(profile.email);
      setAccounts(response.data.accounts || []);
    } catch (err) {
      console.error("Failed to load accounts", err);
      setError(err.response?.data?.error || "Unable to load accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("goldmanUser");
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        setUser(profile);
        setForm((prev) => ({
          ...prev,
          legal_name: profile.name || prev.legal_name,
          email: profile.email || prev.email
        }));
        loadAccounts(profile);
      } catch (err) {
        console.error("Failed to parse user", err);
      }
    }
  }, []);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );

  return (
    <div className="min-h-screen lg:flex bg-[var(--color-navy)] text-[var(--color-text)]">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-sky)]">
            My Accounts
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold">Bank Accounts</h1>
              <p className="text-[var(--color-text)]">
                Linked accounts used for loan disbursement and repayment.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => user && loadAccounts(user)}
                className="bg-[var(--color-blue)]/10 border border-[var(--color-blue)]/20 text-[var(--color-text)] px-5 py-3 rounded-2xl font-semibold hover:bg-[var(--color-blue)]/20 transition"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowForm((prev) => !prev)}
                className="bg-[var(--color-blue)] text-[var(--color-on-blue)] px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-[var(--color-blue)]/30 hover:bg-[var(--color-gray)] transition"
              >
                {showForm ? "Close form" : "Add account"}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-[var(--color-blue)]/20 bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy)] p-6">
            <p className="text-sm text-[var(--color-sky)] uppercase tracking-[0.3em]">
              Total Balance
            </p>
            <h3 className="text-3xl font-semibold mt-2">
              ${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-xs text-[var(--color-gray)] mt-1">
              Across {accounts.length || "no"} accounts
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--color-blue)]/20 bg-[var(--color-charcoal)] p-6">
            <p className="text-sm text-[var(--color-sky)] uppercase tracking-[0.3em]">
              Linked Accounts
            </p>
            <h3 className="text-3xl font-semibold mt-2">{accounts.length}</h3>
            <p className="text-xs text-[var(--color-gray)] mt-1">
              Client workspace can attach one per loan request.
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] p-6">
            <p className="text-sm text-[var(--color-sky)] uppercase tracking-[0.3em]">
              Primary Disbursement
            </p>
            {accounts[0] ? (
              <>
                <h3 className="text-xl font-semibold mt-2">
                  {accounts[0].bank_name}
                </h3>
                <p className="text-sm text-[var(--color-text)]">
                  {accounts[0].account_type} • #{accounts[0].account_number}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--color-text)] mt-2">
                No accounts yet. Add one to unlock instant approvals.
              </p>
            )}
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-2xl border border-red-400/40 bg-red-900/30 text-red-100">
            {error}
          </div>
        )}

        {showForm && (
        <section className="bg-[var(--color-charcoal)] rounded-3xl border border-[var(--color-blue)]/10 p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Add Account</h2>
            <p className="text-sm text-[var(--color-sky)]">
              Capture the same intake questions our branch officers ask, so underwriting has a complete profile.
            </p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!user?.email) return;
              setSaving(true);
              try {
                await addBankAccount({
                  owner_email: user.email,
                  bank_name: form.bank_name,
                  account_type: form.account_type,
                  purpose: form.purpose,
                  legal_name: form.legal_name,
                  dob: form.dob,
                  ssn: form.ssn,
                  residential_address: form.residential_address,
                  mailing_address: form.mailing_address,
                  email: form.email,
                  phone: form.phone,
                  citizen_status: form.citizen_status,
                  employed: form.employed === "yes",
                  annual_income: Number(form.annual_income) || 0,
                  balance: Number(form.balance) || 0
                });
                setForm((prev) => ({
                  ...initialFormState,
                  email: user.email,
                  legal_name: user.name || ""
                }));
                setShowForm(false);
                loadAccounts(user);
              } catch (err) {
                console.error("Failed to add account", err);
                setError(err.response?.data?.error || "Unable to add account.");
              } finally {
                setSaving(false);
              }
            }}
            className="space-y-8"
          >
            <section className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-[var(--color-sky)]">Bank Name *</label>
                <input
                  type="text"
                  value={form.bank_name}
                  onChange={(e) => handleFormChange("bank_name", e.target.value)}
                  required
                  className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--color-sky)]">
                  Account Type *
                </label>
                <select
                  value={form.account_type}
                  onChange={(e) =>
                    handleFormChange("account_type", e.target.value)
                  }
                  className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                >
                  {ACCOUNT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--color-sky)]">
                  Primary Purpose *
                </label>
                <select
                  value={form.purpose}
                  onChange={(e) => handleFormChange("purpose", e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                >
                  {ACCOUNT_PURPOSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="font-semibold text-xl">Personal Details</h3>
                <p className="text-sm text-[var(--color-sky)]">
                  Used for CIP, KYC, and sanctions screening requirements.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[var(--color-sky)]">
                    Legal Name *
                  </label>
                  <input
                    type="text"
                    value={form.legal_name}
                    onChange={(e) =>
                      handleFormChange("legal_name", e.target.value)
                    }
                    required
                    className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--color-sky)]">Date of Birth *</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => handleFormChange("dob", e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--color-sky)]">SSN *</label>
                  <input
                    type="text"
                    value={form.ssn}
                    onChange={(e) => handleFormChange("ssn", e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--color-sky)]">
                    Citizen Status *
                  </label>
                  <input
                    type="text"
                    value={form.citizen_status}
                    onChange={(e) =>
                      handleFormChange("citizen_status", e.target.value)
                    }
                    placeholder="US Citizen, Permanent Resident…"
                    required
                    className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[var(--color-sky)]">
                    Residential Address *
                  </label>
                  <textarea
                    value={form.residential_address}
                    onChange={(e) =>
                      handleFormChange("residential_address", e.target.value)
                    }
                    required
                    className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--color-sky)]">
                    Mailing Address *
                  </label>
                  <textarea
                    value={form.mailing_address}
                    onChange={(e) =>
                      handleFormChange("mailing_address", e.target.value)
                    }
                    required
                    className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[var(--color-sky)]">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    disabled
                    className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none opacity-70 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--color-sky)]">Phone *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-[var(--color-sky)]">Employed *</label>
                <div className="flex gap-3">
                  {["yes", "no"].map((option) => (
                    <label
                      key={option}
                      className={`flex-1 text-center rounded-2xl border px-4 py-3 cursor-pointer transition ${
                        form.employed === option
                          ? "border-[var(--color-blue)] bg-[var(--color-blue)]/10"
                          : "border-[var(--color-blue)]/20 bg-[var(--color-navy)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="employed"
                        value={option}
                        checked={form.employed === option}
                        onChange={(e) =>
                          handleFormChange("employed", e.target.value)
                        }
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        {option === "yes" ? "Yes" : "No"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-[var(--color-sky)]">
                  Annual Income (USD) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.annual_income}
                  onChange={(e) =>
                    handleFormChange("annual_income", e.target.value)
                  }
                  required
                  className="w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                />
              </div>
            </section>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1 text-sm text-[var(--color-sky)]">
                <p>Optional opening deposit</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.balance}
                  onChange={(e) => handleFormChange("balance", e.target.value)}
                  className="w-48 rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-navy)] px-4 py-3 text-[var(--color-text)] outline-none"
                />
              </div>
              <button
                disabled={saving}
                className="bg-[var(--color-blue)] text-[var(--color-on-blue)] px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-[var(--color-blue)]/30 hover:bg-[var(--color-gray)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Submit account application"}
              </button>
            </div>
          </form>
        </section>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[var(--color-blue)]" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 rounded-3xl border border-dashed border-[var(--color-blue)]/40 bg-[var(--color-navy)] text-center space-y-3">
            <p className="text-lg font-semibold text-[var(--color-text)]">
              No accounts linked yet
            </p>
            <p className="text-sm text-[var(--color-text)] max-w-lg mx-auto">
              Add a checking, savings, student, or business account to speed up disbursement and repayment workflows.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[var(--color-blue)] text-[var(--color-on-blue)] px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-[var(--color-blue)]/30 hover:bg-[var(--color-gray)] transition"
            >
              Add your first account
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-[var(--color-charcoal)] border border-[var(--color-blue)]/20 rounded-3xl p-6 space-y-3"
              >
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-sky)]">
                  {account.bank_name}
                </p>
                <h3 className="text-2xl font-semibold">
                  {account.account_type}
                </h3>
                <p className="text-sm text-[var(--color-text)] flex items-center justify-between gap-3">
                  <span>Account #{account.account_number}</span>
                  <span className="text-xs px-3 py-1 rounded-full border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/10">
                    {account.purpose?.replace(/_/g, " ") || "Purpose N/A"}
                  </span>
                </p>
                <div className="space-y-1 text-sm text-[var(--color-text)]">
                  <p>
                    Balance: ${Number(account.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  {account.legal_name && <p>Owner: {account.legal_name}</p>}
                  {account.phone && <p>Phone: {account.phone}</p>}
                </div>
                <p className="text-xs text-[var(--color-sky)]">
                  Added on {new Date(account.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
