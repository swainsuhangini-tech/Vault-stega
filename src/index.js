import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/globals.css";
import "./styles/theme.css";
import "./styles/animations.css";
import App from "./app/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
