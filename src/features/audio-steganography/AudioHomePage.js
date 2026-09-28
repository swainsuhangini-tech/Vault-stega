import React from "react";
import { AudioLines, ArrowRightLeft } from "lucide-react";
import ActionCard from "../../components/cards/ActionCard";

export default function AudioHomePage() {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>
            <AudioLines size={22} /> Audio Steganography
          </h1>
          <p className="page__subtitle">Hide encrypted data inside PCM WAV audio using LSB embedding, or extract it back out.</p>
        </div>
      </div>
      <section className="panel">
        <div className="action-grid">
          <ActionCard icon={ArrowRightLeft} title="Embed" description="Hide a message or file inside a cover WAV file." to="/audio/embed" />
          <ActionCard icon={ArrowRightLeft} title="Extract" description="Recover a hidden message or file from a stego WAV file." to="/audio/extract" />
        </div>
      </section>
    </div>
  );
}
