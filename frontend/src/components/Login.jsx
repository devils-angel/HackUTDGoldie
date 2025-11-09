import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(form);
      alert("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      alert({error});
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
      <h2 className="text-2xl font-bold mb-6 text-blue-600 text-center">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        Sign In
      </button>
      <p className="text-sm text-center">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-600 underline">
          Register
        </Link>
      </p>
    </form>
    </div>
    </div>
  );
}
