import React from "react";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Is my data ever uploaded anywhere?",
    a: "No. All image, audio, encryption, and vault processing happens locally in your browser. Firebase is used only to authenticate your account.",
  },
  {
    q: "What image formats are supported?",
    a: "PNG and BMP for embedding cover images. Stego images are always exported as PNG to avoid lossy recompression destroying the hidden data.",
  },
  {
    q: "What audio formats are supported?",
    a: "Uncompressed 16-bit PCM WAV files. Compressed formats like MP3 are not supported because lossy compression would destroy the hidden LSB data.",
  },
  {
    q: "What happens if I forget my password?",
    a: "Passwords are never stored anywhere. Encryption is one-way without it — there is no recovery mechanism, by design.",
  },
  {
    q: "Why did extraction fail?",
    a: "Usually because the stego file was modified or recompressed after embedding, the wrong bit depth was assumed, or (for encrypted payloads) the password is incorrect.",
  },
];

export default function HelpPage() {
  return (
    <div className="page">
      <div className="page__header">
        <h1>
          <HelpCircle size={22} /> Help
        </h1>
        <p className="page__subtitle">Frequently asked questions.</p>
      </div>
      <section className="panel">
        {FAQS.map((f, i) => (
          <details key={i} className="faq">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
