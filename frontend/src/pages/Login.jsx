import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function Login() {

  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [accountType, setAccountType] = useState("employee");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);

      if (res.data.role !== accountType) {
        setError(`This account is not registered as an ${accountType === "admin" ? "administrator" : "employee"}. Choose the correct account type.`);
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      navigate("/dashboard");
    } catch (err) {
      const message = err.response?.data?.message;

      if (message === "Password is incorrect") {
        setError("Password is incorrect");
      } else if (message === "Email does not exist") {
        setError("This email does not exist");
      } else {
        setError(message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="auth-shell">

      <div className="auth-card">

        <div className="auth-mark" aria-hidden="true">L</div>
        <h2 className="text-2xl font-semibold text-center mb-2">
          Welcome back
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          Sign in to your LeaveFlow account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Sign in as
            </legend>
            <div className="role-choice-grid">
              {[
                { value: "employee", label: "Employee" },
                { value: "admin", label: "Administrator" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`role-choice${accountType === option.value ? " selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value={option.value}
                    checked={accountType === option.value}
                    onChange={() => setAccountType(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Administrator access is available only to accounts authorized by your system administrator.
            </p>
          </fieldset>

          <input
            type="email"
            placeholder={accountType === "admin" ? "admin@example.com" : "employee@example.com"}
            aria-label="Email address"
            autoComplete="email"
            required
            className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder={accountType === "admin" ? "Administrator password" : "Employee password"}
            aria-label="Password"
            autoComplete="current-password"
            required
            className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-md text-white font-medium transition ${loading
                ? "bg-slate-500 cursor-not-allowed"
                : "bg-slate-800 hover:bg-slate-900"
              }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-blue-700 hover:underline">
            Create account
          </Link>
        </p>

      </div>

    </div>

  );
}

export default Login;