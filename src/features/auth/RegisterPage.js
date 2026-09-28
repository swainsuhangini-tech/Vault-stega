import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import PasswordField from "../../components/forms/PasswordField";
import { useNotify } from "../../context/NotificationContext";

export default function RegisterPage() {
  const { register, firebaseConfigured } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const notify = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, displayName);
      notify.success("Account created.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Create account</h2>
      <p className="auth-form__subtitle">Your data still never leaves this device.</p>

      {!firebaseConfigured && (
        <div className="alert alert--warning">
          Firebase isn't configured yet. Add your credentials to <code>.env.local</code> to enable registration.
        </div>
      )}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="form-field">
        <label htmlFor="displayName">Name</label>
        <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
      </div>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <PasswordField id="password" label="Password" value={password} onChange={setPassword} showStrength autoComplete="new-password" />
      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
      />

      <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </button>

      <p className="auth-form__footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}
