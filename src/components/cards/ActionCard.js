import React from "react";
import { useNavigate } from "react-router-dom";

export default function ActionCard({ icon: Icon, title, description, to }) {
  const navigate = useNavigate();
  return (
    <button className="action-card" onClick={() => navigate(to)}>
      <div className="action-card__icon">
        <Icon size={20} />
      </div>
      <div className="action-card__title">{title}</div>
      <div className="action-card__description">{description}</div>
    </button>
  );
}
