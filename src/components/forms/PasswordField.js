import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { estimatePasswordStrength } from "../../services/cryptoService";

export default function PasswordField({ label, value, onChange, showStrength = false, id, autoComplete }) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? estimatePasswordStrength(value) : null;

  return (
    <div className="form-field">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="password-field">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete || "current-password"}
        />
        <button
          type="button"
          className="icon-button password-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {showStrength && value && (
        <div className={`password-strength password-strength--${strength.score}`}>
          <div className="password-strength__bar">
            <div style={{ width: `${Math.min(100, (strength.score / 6) * 100)}%` }} />
          </div>
          <span>{strength.label}</span>
        </div>
      )}
    </div>
  );
}
