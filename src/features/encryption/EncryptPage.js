import React, { useState } from "react";
import Dropzone from "../../components/forms/Dropzone";
import PasswordField from "../../components/forms/PasswordField";
import { encryptBytes } from "../../services/cryptoService";
import { buildPayload } from "../../utils/payloadFormat";
import { exportEncryptedContainer } from "../../services/exportService";
import { formatBytes, inferMimeFromName } from "../../services/fileService";
import { operationsRepository } from "../../database/repositories/projectsRepository";
import { useNotify } from "../../context/NotificationContext";

export default function EncryptPage() {
  const notify = useNotify();
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleEncrypt = async () => {
    if (mode === "text" && !text) return notify.error("Enter text to encrypt.");
    if (mode === "file" && !file) return notify.error("Choose a file to encrypt.");
    if (!password) return notify.error("Enter a password.");
    if (password !== confirmPassword) return notify.error("Passwords do not match.");

    setBusy(true);
    const startedAt = performance.now();
    try {
      let dataBytes;
      let filename = "";
      let mime = "";
      const isFile = mode === "file";

      if (isFile) {
        dataBytes = new Uint8Array(await file.arrayBuffer());
        filename = file.name;
        mime = file.type || inferMimeFromName(file.name);
      } else {
        dataBytes = new TextEncoder().encode(text);
      }

      const encrypted = await encryptBytes(dataBytes, password);
      const container = buildPayload({ isEncrypted: true, isFile, filename, mime, data: encrypted });
      exportEncryptedContainer(container, isFile ? `${filename}.svenc` : `encrypted-text-${Date.now()}.svenc`);

      await operationsRepository.record({
        projectId: null,
        operationType: "encrypt",
        mediaType: isFile ? "file" : "text",
        fileName: isFile ? filename : "text-payload",
        fileSize: isFile ? file.size : dataBytes.length,
        payloadSize: container.length,
        algorithm: "AES-256-GCM",
        success: true,
        duration: Math.round(performance.now() - startedAt),
      });
      notify.success("Encrypted container downloaded.");
    } catch (e) {
      notify.error(e.message || "Encryption failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Encrypt Text/File</h1>
        <p className="page__subtitle">Create a standalone encrypted container (.svenc) — independent of steganography.</p>
      </div>

      <section className="panel">
        <div className="tab-switch">
          <button className={mode === "text" ? "active" : ""} onClick={() => setMode("text")}>
            Text
          </button>
          <button className={mode === "file" ? "active" : ""} onClick={() => setMode("file")}>
            File
          </button>
        </div>
        {mode === "text" ? (
          <textarea className="textarea" rows={6} placeholder="Enter text to encrypt..." value={text} onChange={(e) => setText(e.target.value)} />
        ) : (
          <Dropzone onFile={setFile} hint={file ? `${file.name} (${formatBytes(file.size)})` : "Any file type"} />
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">Password</h2>
        <PasswordField id="encrypt-password" label="Password" value={password} onChange={setPassword} showStrength autoComplete="new-password" />
        <PasswordField id="encrypt-confirm-password" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
      </section>

      <div className="page__actions">
        <button className="btn btn--primary" onClick={handleEncrypt} disabled={busy}>
          {busy ? "Encrypting..." : "Encrypt & Download"}
        </button>
      </div>
    </div>
  );
}
