import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import PasswordField from "../../components/forms/PasswordField";
import { useNotify } from "../../context/NotificationContext";

export default function LoginPage() {
  const { login, firebaseConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      notify.success("Welcome back.");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Sign in</h2>
      <p className="auth-form__subtitle">Access your local StegaVault vault.</p>

      {!firebaseConfigured && (
        <div className="alert alert--warning">
          Firebase isn't configured yet. Add your credentials to <code>.env.local</code> to enable sign-in.
        </div>
      )}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <PasswordField id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />

      <div className="auth-form__row">
        <Link to="/forgot-password">Forgot password?</Link>
      </div>

      <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="auth-form__footer">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </form>
  );
}
