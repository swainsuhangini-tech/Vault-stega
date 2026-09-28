import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";

export default function ForgotPasswordPage() {
  const { sendReset, firebaseConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Reset password</h2>
      <p className="auth-form__subtitle">We'll email you a link to reset your password.</p>

      {!firebaseConfigured && (
        <div className="alert alert--warning">Firebase isn't configured yet.</div>
      )}
      {error && <div className="alert alert--error">{error}</div>}
      {sent && <div className="alert alert--success">If an account exists for that email, a reset link is on its way.</div>}

      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>

      <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send reset link"}
      </button>

      <p className="auth-form__footer">
        <Link to="/login">Back to sign in</Link>
      </p>
    </form>
  );
}
