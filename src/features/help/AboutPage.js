import React from "react";
import { Info } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="page">
      <div className="page__header">
        <h1>
          <Info size={22} /> About StegaVault
        </h1>
      </div>
      <section className="panel">
        <p>
          StegaVault is an offline-first steganography suite for hiding encrypted text and files inside PNG images
          and PCM WAV audio. It uses real LSB (least-significant-bit) embedding, AES-256-GCM encryption via the Web
          Crypto API, and stores everything locally in IndexedDB.
        </p>
        <p>Encrypted locally with AES-GCM. Media processing occurs in your browser.</p>
        <p>Firebase is used only for account authentication — never for storing or transmitting your media or secrets.</p>
      </section>
    </div>
  );
}
