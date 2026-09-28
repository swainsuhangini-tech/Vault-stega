import React from "react";
import { Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-shell__panel">
        <div className="auth-shell__brand">
          <ShieldCheck size={28} />
          <h1>StegaVault</h1>
          <p>Secure • Local • Private</p>
        </div>
        <Outlet />
      </div>
      <div className="auth-shell__aside">
        <h2>Your media and secrets stay on this device.</h2>
        <p>Firebase is used only for account authentication. All steganography, encryption, and storage happen locally in your browser.</p>
        <ul>
          <li>AES-256-GCM encryption via the Web Crypto API</li>
          <li>Real LSB steganography for PNG images and PCM WAV audio</li>
          <li>Local-only IndexedDB storage — no media ever uploaded</li>
        </ul>
      </div>
    </div>
  );
}
