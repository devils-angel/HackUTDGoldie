import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";

const roles = [
  { label: "Admin", value: "ADMIN" },
  { label: "Vendor", value: "VENDOR" },
  { label: "Client", value: "CLIENT" },
];

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENT",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registerUser(form);
      const user = response?.data?.user;
      const token = response?.data?.token;
      if (user) {
        localStorage.setItem("goldmanUser", JSON.stringify(user));
      }
      if (token) {
        localStorage.setItem("goldmanToken", token);
      }
      alert("Registration successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      localStorage.removeItem("goldmanUser");
      localStorage.removeItem("goldmanToken");
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center px-6 py-12">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="text-[var(--color-text)] space-y-6 order-2 md:order-1">
          <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-[var(--color-sky)]">
            <span className="w-10 h-px bg-[var(--color-sky)]" />
            Goldman Onboarding
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            Open your access to enterprise-grade lending tools.
          </h1>
          <p className="text-lg text-[var(--color-text)]">
            Create an account to track KYC status, monitor pipeline health, and
            collaborate with underwriting in real time.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 md:p-10 space-y-6 order-1 md:order-2">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
              Create account
            </h2>
            <p className="text-sm text-gray-500">
              We’ll get you inside in less than a minute.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Alex Morgan"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/20 outline-none transition"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/20 outline-none transition"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a secure password"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/20 outline-none transition"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">Role</label>
          <select
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 bg-white focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/20 outline-none transition"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            required
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <button className="w-full bg-[var(--color-blue)] text-[var(--color-on-blue)] rounded-xl py-3.5 font-semibold tracking-wide shadow-lg shadow-[var(--color-blue)]/20 hover:bg-[var(--color-gray)] transition">
              Create account
            </button>
          </form>

          <p className="text-sm text-center text-gray-500">
            Already have access?{" "}
            <Link to="/login" className="text-[var(--color-blue)] font-medium">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
