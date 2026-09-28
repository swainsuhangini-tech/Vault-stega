import React from "react";

export default function FullScreenLoader({ label = "Loading..." }) {
  return (
    <div className="fullscreen-loader">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
