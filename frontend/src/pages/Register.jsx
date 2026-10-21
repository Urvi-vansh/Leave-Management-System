import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    if (form.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/register", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400";

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-mark" aria-hidden="true">L</div>
        <h2 className="text-2xl font-semibold text-center mb-2">
          Create your account
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          Get started with LeaveFlow
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            aria-label="Full name"
            autoComplete="name"
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email address"
            aria-label="Email address"
            autoComplete="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete="new-password"
            className={inputClass}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            aria-label="Confirm password"
            autoComplete="new-password"
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md text-white transition ${
              loading
                ? "bg-slate-500 cursor-not-allowed"
                : "bg-slate-800 hover:bg-slate-900"
            }`}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
