import React, { useState } from "react";
import Dropzone from "../../components/forms/Dropzone";
import PasswordField from "../../components/forms/PasswordField";
import { decryptBytes } from "../../services/cryptoService";
import { parsePayload } from "../../utils/payloadFormat";
import { downloadBlob, formatBytes, bytesToBlob } from "../../services/fileService";
import { operationsRepository } from "../../database/repositories/projectsRepository";
import { useNotify } from "../../context/NotificationContext";

export default function DecryptPage() {
  const notify = useNotify();
  const [containerFile, setContainerFile] = useState(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const handleDecrypt = async () => {
    if (!containerFile) return notify.error("Choose an encrypted (.svenc) container.");
    if (!password) return notify.error("Enter the password.");

    setBusy(true);
    const startedAt = performance.now();
    try {
      const containerBytes = new Uint8Array(await containerFile.arrayBuffer());
      const parsed = parsePayload(containerBytes);
      const decrypted = await decryptBytes(parsed.data, password);

      if (parsed.isFile) {
        setResult({ isFile: true, filename: parsed.filename, mime: parsed.mime, bytes: decrypted });
      } else {
        setResult({ isFile: false, text: new TextDecoder().decode(decrypted) });
      }

      await operationsRepository.record({
        projectId: null,
        operationType: "decrypt",
        mediaType: parsed.isFile ? "file" : "text",
        fileName: containerFile.name,
        fileSize: containerFile.size,
        payloadSize: decrypted.length,
        algorithm: "AES-256-GCM",
        success: true,
        duration: Math.round(performance.now() - startedAt),
      });
      notify.success("Decrypted successfully.");
    } catch (e) {
      notify.error(e.message || "Decryption failed.");
      await operationsRepository.record({
        projectId: null,
        operationType: "decrypt",
        mediaType: "unknown",
        fileName: containerFile?.name,
        fileSize: containerFile?.size,
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
        <h1>Decrypt Payload</h1>
        <p className="page__subtitle">Decrypt a .svenc container back into its original text or file.</p>
      </div>

      <section className="panel">
        <h2 className="panel__title">1. Encrypted container</h2>
        <Dropzone accept=".svenc" onFile={(f) => { setContainerFile(f); setResult(null); }} hint=".svenc file" />
      </section>

      <section className="panel">
        <h2 className="panel__title">2. Password</h2>
        <PasswordField id="decrypt-password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
      </section>

      <div className="page__actions">
        <button className="btn btn--primary" onClick={handleDecrypt} disabled={busy}>
          {busy ? "Decrypting..." : "Decrypt"}
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
