import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>This page doesn't exist.</p>
      <Link to="/dashboard" className="btn btn--primary">
        Return to Dashboard
      </Link>
    </div>
  );
}
