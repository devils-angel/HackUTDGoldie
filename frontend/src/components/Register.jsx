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
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
      <h2 className="text-2xl font-bold mb-6 text-blue-600 text-center">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Full Name"
          className="p-2 rounded bg-gray-50 text-black border border-gray-400"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="p-2 rounded bg-gray-50 text-black border border-gray-400"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="p-2 rounded bg-gray-50 text-black border border-gray-400"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="bg-blue-600 text-white rounded p-2 hover:opacity-90">
          Create Account
        </button>
        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  </div>
);

}
