import React from "react";

export default function StatusCard({ label, status = "Ready", tone = "good" }) {
  return (
    <div className="status-card">
      <div className={`status-dot status-dot--${tone}`} />
      <div>
        <div className="status-card__label">{label}</div>
        <div className="status-card__status">{status}</div>
      </div>
    </div>
  );
}
