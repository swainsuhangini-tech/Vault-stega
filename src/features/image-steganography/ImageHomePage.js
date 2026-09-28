import React from "react";
import { ImageIcon, ArrowRightLeft } from "lucide-react";
import ActionCard from "../../components/cards/ActionCard";

export default function ImageHomePage() {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>
            <ImageIcon size={22} /> Image Steganography
          </h1>
          <p className="page__subtitle">Hide encrypted data inside PNG images using LSB embedding, or extract it back out.</p>
        </div>
      </div>
      <section className="panel">
        <div className="action-grid">
          <ActionCard icon={ArrowRightLeft} title="Embed" description="Hide a message or file inside a cover PNG image." to="/image/embed" />
          <ActionCard icon={ArrowRightLeft} title="Extract" description="Recover a hidden message or file from a stego PNG image." to="/image/extract" />
        </div>
      </section>
    </div>
  );
}
