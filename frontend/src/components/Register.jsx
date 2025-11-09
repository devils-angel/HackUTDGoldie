import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(form);
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#22263F] flex items-center justify-center px-6 py-12">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="text-white space-y-6 order-2 md:order-1">
          <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-[#A5B8D0]">
            <span className="w-10 h-px bg-[#A5B8D0]" />
            Goldman Onboarding
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            Open your access to enterprise-grade lending tools.
          </h1>
          <p className="text-lg text-[#C3CDDA]">
            Create an account to track KYC status, monitor pipeline health, and
            collaborate with underwriting in real time.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 md:p-10 space-y-6 order-1 md:order-2">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[#22263F]">
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
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-[#2178C4] focus:ring-2 focus:ring-[#2178C4]/20 outline-none transition"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-[#2178C4] focus:ring-2 focus:ring-[#2178C4]/20 outline-none transition"
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
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-[#2178C4] focus:ring-2 focus:ring-[#2178C4]/20 outline-none transition"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button className="w-full bg-[#2178C4] text-white rounded-xl py-3.5 font-semibold tracking-wide shadow-lg shadow-[#2178C4]/20 hover:bg-[#1b63a0] transition">
              Create account
            </button>
          </form>

          <p className="text-sm text-center text-gray-500">
            Already have access?{" "}
            <Link to="/login" className="text-[#2178C4] font-medium">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
