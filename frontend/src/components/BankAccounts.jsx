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
    <div className="min-h-screen lg:flex bg-[#101327] text-white">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-[#A5B8D0]">
            My Accounts
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold">Bank Accounts</h1>
              <p className="text-[#C3CDDA]">
                Linked accounts used for loan disbursement and repayment.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => user && loadAccounts(user)}
                className="bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl font-semibold hover:bg-white/10 transition"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowForm((prev) => !prev)}
                className="bg-[#2178C4] text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-[#2178C4]/30 hover:bg-[#1b63a0] transition"
              >
                {showForm ? "Close form" : "Add account"}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1F2A4A] to-[#12152D] p-6">
            <p className="text-sm text-[#A5B8D0] uppercase tracking-[0.3em]">
              Total Balance
            </p>
            <h3 className="text-3xl font-semibold mt-2">
              ${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-xs text-[#7A82AE] mt-1">
              Across {accounts.length || "no"} accounts
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#1B1F35] p-6">
            <p className="text-sm text-[#A5B8D0] uppercase tracking-[0.3em]">
              Linked Accounts
            </p>
            <h3 className="text-3xl font-semibold mt-2">{accounts.length}</h3>
            <p className="text-xs text-[#7A82AE] mt-1">
              Client workspace can attach one per loan request.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10163A] p-6">
            <p className="text-sm text-[#A5B8D0] uppercase tracking-[0.3em]">
              Primary Disbursement
            </p>
            {accounts[0] ? (
              <>
                <h3 className="text-xl font-semibold mt-2">
                  {accounts[0].bank_name}
                </h3>
                <p className="text-sm text-[#C3CDDA]">
                  {accounts[0].account_type} • #{accounts[0].account_number}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#C3CDDA] mt-2">
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
        <section className="bg-[#1B1F35] rounded-3xl border border-white/5 p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Add Account</h2>
            <p className="text-sm text-[#A5B8D0]">
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
                <label className="text-sm text-[#A5B8D0]">Bank Name *</label>
                <input
                  type="text"
                  value={form.bank_name}
                  onChange={(e) => handleFormChange("bank_name", e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#A5B8D0]">
                  Account Type *
                </label>
                <select
                  value={form.account_type}
                  onChange={(e) =>
                    handleFormChange("account_type", e.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                >
                  {ACCOUNT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#A5B8D0]">
                  Primary Purpose *
                </label>
                <select
                  value={form.purpose}
                  onChange={(e) => handleFormChange("purpose", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
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
                <p className="text-sm text-[#A5B8D0]">
                  Used for CIP, KYC, and sanctions screening requirements.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[#A5B8D0]">
                    Legal Name *
                  </label>
                  <input
                    type="text"
                    value={form.legal_name}
                    onChange={(e) =>
                      handleFormChange("legal_name", e.target.value)
                    }
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#A5B8D0]">Date of Birth *</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => handleFormChange("dob", e.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#A5B8D0]">SSN *</label>
                  <input
                    type="text"
                    value={form.ssn}
                    onChange={(e) => handleFormChange("ssn", e.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#A5B8D0]">
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
                    className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[#A5B8D0]">
                    Residential Address *
                  </label>
                  <textarea
                    value={form.residential_address}
                    onChange={(e) =>
                      handleFormChange("residential_address", e.target.value)
                    }
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#A5B8D0]">
                    Mailing Address *
                  </label>
                  <textarea
                    value={form.mailing_address}
                    onChange={(e) =>
                      handleFormChange("mailing_address", e.target.value)
                    }
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[#A5B8D0]">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    disabled
                    className="w-full rounded-2xl border border-white/10 bg-[#1F2240] px-4 py-3 text-white outline-none opacity-70 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#A5B8D0]">Phone *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-[#A5B8D0]">Employed *</label>
                <div className="flex gap-3">
                  {["yes", "no"].map((option) => (
                    <label
                      key={option}
                      className={`flex-1 text-center rounded-2xl border px-4 py-3 cursor-pointer transition ${
                        form.employed === option
                          ? "border-[#2178C4] bg-[#2178C4]/10"
                          : "border-white/10 bg-[#15193A]"
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
                <label className="text-sm text-[#A5B8D0]">
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
                  className="w-full rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                />
              </div>
            </section>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1 text-sm text-[#A5B8D0]">
                <p>Optional opening deposit</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.balance}
                  onChange={(e) => handleFormChange("balance", e.target.value)}
                  className="w-48 rounded-2xl border border-white/10 bg-[#15193A] px-4 py-3 text-white outline-none"
                />
              </div>
              <button
                disabled={saving}
                className="bg-[#2178C4] text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-[#2178C4]/30 hover:bg-[#1b63a0] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Submit account application"}
              </button>
            </div>
          </form>
        </section>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#2178C4]" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 rounded-3xl border border-dashed border-[#2178C4]/40 bg-[#14183A] text-center space-y-3">
            <p className="text-lg font-semibold text-white">
              No accounts linked yet
            </p>
            <p className="text-sm text-[#C3CDDA] max-w-lg mx-auto">
              Add a checking, savings, student, or business account to speed up disbursement and repayment workflows.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#2178C4] text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-[#2178C4]/30 hover:bg-[#1b63a0] transition"
            >
              Add your first account
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-[#1B1F35] border border-white/10 rounded-3xl p-6 space-y-3"
              >
                <p className="text-sm uppercase tracking-[0.3em] text-[#A5B8D0]">
                  {account.bank_name}
                </p>
                <h3 className="text-2xl font-semibold">
                  {account.account_type}
                </h3>
                <p className="text-sm text-[#C3CDDA] flex items-center justify-between gap-3">
                  <span>Account #{account.account_number}</span>
                  <span className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5">
                    {account.purpose?.replace(/_/g, " ") || "Purpose N/A"}
                  </span>
                </p>
                <div className="space-y-1 text-sm text-[#C3CDDA]">
                  <p>
                    Balance: ${Number(account.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  {account.legal_name && <p>Owner: {account.legal_name}</p>}
                  {account.phone && <p>Phone: {account.phone}</p>}
                </div>
                <p className="text-xs text-[#A5B8D0]">
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
