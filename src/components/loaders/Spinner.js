import React from "react";

export default function Spinner({ size = 18 }) {
  return (
    <span
      className="spinner-inline"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}
