import React, { useState } from "react";
import Dropzone from "../../components/forms/Dropzone";
import PasswordField from "../../components/forms/PasswordField";
import { extractFromAudio } from "../../services/audioStegoService";
import { parsePayload } from "../../utils/payloadFormat";
import { decryptBytes } from "../../services/cryptoService";
import { downloadBlob, formatBytes, bytesToBlob } from "../../services/fileService";
import { operationsRepository } from "../../database/repositories/projectsRepository";
import { useNotify } from "../../context/NotificationContext";

export default function AudioExtractPage() {
  const notify = useNotify();
  const [stegoFile, setStegoFile] = useState(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const handleExtract = async () => {
    if (!stegoFile) return notify.error("Choose a stego WAV file first.");
    setBusy(true);
    setResult(null);
    const startedAt = performance.now();
    try {
      const rawPayload = await extractFromAudio(stegoFile);
      const parsed = parsePayload(rawPayload);

      let finalData = parsed.data;
      if (parsed.isEncrypted) {
        if (!password) throw new Error("This payload is encrypted — enter the password to decrypt it.");
        finalData = await decryptBytes(finalData, password);
      }

      if (parsed.isFile) {
        setResult({ isFile: true, filename: parsed.filename, mime: parsed.mime, bytes: finalData });
      } else {
        setResult({ isFile: false, text: new TextDecoder().decode(finalData) });
      }

      await operationsRepository.record({
        projectId: null,
        operationType: "extract",
        mediaType: "audio",
        fileName: stegoFile.name,
        fileSize: stegoFile.size,
        payloadSize: rawPayload.length,
        algorithm: parsed.isEncrypted ? "AES-256-GCM" : "none",
        success: true,
        duration: Math.round(performance.now() - startedAt),
      });
      notify.success("Payload extracted successfully.");
    } catch (e) {
      notify.error(e.message || "Extraction failed.");
      await operationsRepository.record({
        projectId: null,
        operationType: "extract",
        mediaType: "audio",
        fileName: stegoFile?.name,
        fileSize: stegoFile?.size,
        payloadSize: 0,
        success: false,
        errorMessage: e.message,
        duration: Math.round(performance.now() - startedAt),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Extract — Audio</h1>
        <p className="page__subtitle">Recover and decrypt a hidden message or file from a stego WAV file.</p>
      </div>

      <section className="panel">
        <h2 className="panel__title">1. Stego audio</h2>
        <Dropzone accept="audio/wav,.wav" onFile={(f) => { setStegoFile(f); setResult(null); }} hint="WAV produced by StegaVault" />
      </section>

      <section className="panel">
        <h2 className="panel__title">2. Decryption password</h2>
        <PasswordField id="audio-extract-password" label="Password (leave blank if payload wasn't encrypted)" value={password} onChange={setPassword} autoComplete="current-password" />
      </section>

      <div className="page__actions">
        <button className="btn btn--primary" onClick={handleExtract} disabled={busy}>
          {busy ? "Extracting..." : "Extract Payload"}
        </button>
      </div>

      {result && (
        <section className="panel">
          <h2 className="panel__title">Result</h2>
          {result.isFile ? (
            <div>
              <p>
                Recovered file: <strong>{result.filename}</strong> ({formatBytes(result.bytes.length)})
              </p>
              <button className="btn btn--secondary" onClick={() => downloadBlob(bytesToBlob(result.bytes, result.mime), result.filename)}>
                Download Recovered File
              </button>
            </div>
          ) : (
            <textarea className="textarea" rows={6} readOnly value={result.text} />
          )}
        </section>
      )}
    </div>
  );
}
