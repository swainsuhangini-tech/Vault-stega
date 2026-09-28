import React, { useState, useMemo } from "react";
import Dropzone from "../../components/forms/Dropzone";
import PasswordField from "../../components/forms/PasswordField";
import { getAudioInfo, embedInAudio } from "../../services/audioStegoService";
import { buildPayload, estimatePayloadLength } from "../../utils/payloadFormat";
import { encryptBytes } from "../../services/cryptoService";
import { downloadBlob, formatBytes, inferMimeFromName } from "../../services/fileService";
import { operationsRepository } from "../../database/repositories/projectsRepository";
import { useNotify } from "../../context/NotificationContext";

export default function AudioEmbedPage() {
  const notify = useNotify();
  const [coverFile, setCoverFile] = useState(null);
  const [audioInfo, setAudioInfo] = useState(null);
  const [mode, setMode] = useState("text");
  const [secretText, setSecretText] = useState("");
  const [secretFile, setSecretFile] = useState(null);
  const [password, setPassword] = useState("");
  const [encrypt, setEncrypt] = useState(true);
  const [bitDepth, setBitDepth] = useState(1);
  const [busy, setBusy] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);

  const handleCoverFile = async (file) => {
    setResultBlob(null);
    if (!file.name.match(/\.wav$/i)) {
      notify.error("Please choose a .wav file.");
      return;
    }
    setCoverFile(file);
    try {
      const info = await getAudioInfo(file);
      setAudioInfo(info);
    } catch (e) {
      notify.error(e.message);
    }
  };

  const capacity = audioInfo?.capacities?.[bitDepth] ?? 0;

  const estimatedPayloadSize = useMemo(() => {
    if (mode === "text") {
      const dataLength = new TextEncoder().encode(secretText).length + (encrypt ? 44 : 0);
      return estimatePayloadLength({ filename: "", mime: "", dataLength });
    }
    if (secretFile) {
      const dataLength = secretFile.size + (encrypt ? 44 : 0);
      return estimatePayloadLength({ filename: secretFile.name, mime: secretFile.type, dataLength });
    }
    return 0;
  }, [mode, secretText, secretFile, encrypt]);

  const handleEmbed = async () => {
    if (!coverFile) return notify.error("Choose a cover WAV file first.");
    if (mode === "text" && !secretText) return notify.error("Enter a secret message.");
    if (mode === "file" && !secretFile) return notify.error("Choose a file to hide.");
    if (encrypt && !password) return notify.error("Enter a password to encrypt the payload.");

    setBusy(true);
    const startedAt = performance.now();
    try {
      let dataBytes;
      let filename = "";
      let mime = "";
      const isFile = mode === "file";

      if (isFile) {
        const buf = await secretFile.arrayBuffer();
        dataBytes = new Uint8Array(buf);
        filename = secretFile.name;
        mime = secretFile.type || inferMimeFromName(secretFile.name);
      } else {
        dataBytes = new TextEncoder().encode(secretText);
      }

      if (encrypt) {
        dataBytes = await encryptBytes(dataBytes, password);
      }

      const payload = buildPayload({ isEncrypted: encrypt, isFile, filename, mime, data: dataBytes });
      const blob = await embedInAudio(coverFile, payload, { bitDepth });
      setResultBlob(blob);

      await operationsRepository.record({
        projectId: null,
        operationType: "embed",
        mediaType: "audio",
        fileName: coverFile.name,
        fileSize: coverFile.size,
        payloadSize: payload.length,
        capacity,
        algorithm: encrypt ? "AES-256-GCM" : "none",
        success: true,
        duration: Math.round(performance.now() - startedAt),
      });

      notify.success("Payload embedded successfully.");
    } catch (e) {
      notify.error(e.message || "Embedding failed.");
      await operationsRepository.record({
        projectId: null,
        operationType: "embed",
        mediaType: "audio",
        fileName: coverFile?.name,
        fileSize: coverFile?.size,
        payloadSize: 0,
        success: false,
        errorMessage: e.message,
        duration: Math.round(performance.now() - startedAt),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) downloadBlob(resultBlob, `stego-${coverFile.name.replace(/\.[^.]+$/, "")}.wav`);
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Embed — Audio</h1>
        <p className="page__subtitle">Hide a text message or file inside a cover PCM WAV file.</p>
      </div>

      <section className="panel">
        <h2 className="panel__title">1. Cover audio</h2>
        <Dropzone accept="audio/wav,.wav" onFile={handleCoverFile} hint="16-bit PCM WAV" />
        {audioInfo && (
          <div className="info-row">
            <div>
              <div>
                {audioInfo.sampleRate} Hz · {audioInfo.numChannels === 1 ? "Mono" : "Stereo"} · {audioInfo.bitsPerSample}-bit ·{" "}
                {audioInfo.durationSeconds.toFixed(1)}s
              </div>
              <div>Capacity at {bitDepth}-bit depth: {formatBytes(capacity)}</div>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">2. Secret payload</h2>
        <div className="tab-switch">
          <button className={mode === "text" ? "active" : ""} onClick={() => setMode("text")}>
            Text
          </button>
          <button className={mode === "file" ? "active" : ""} onClick={() => setMode("file")}>
            File
          </button>
        </div>
        {mode === "text" ? (
          <textarea className="textarea" rows={5} placeholder="Enter the secret message to hide..." value={secretText} onChange={(e) => setSecretText(e.target.value)} />
        ) : (
          <Dropzone onFile={setSecretFile} hint={secretFile ? `${secretFile.name} (${formatBytes(secretFile.size)})` : "Any file type"} />
        )}
        <div className="capacity-bar">
          <div
            className={`capacity-bar__fill ${estimatedPayloadSize > capacity ? "capacity-bar__fill--over" : ""}`}
            style={{ width: `${Math.min(100, (estimatedPayloadSize / (capacity || 1)) * 100)}%` }}
          />
        </div>
        <p className="capacity-label">
          Estimated payload: {formatBytes(estimatedPayloadSize)} / Capacity: {formatBytes(capacity)}
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">3. Encryption & options</h2>
        <label className="checkbox-row">
          <input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} />
          Encrypt payload before embedding (AES-256-GCM)
        </label>
        {encrypt && <PasswordField id="audio-embed-password" label="Password" value={password} onChange={setPassword} showStrength autoComplete="new-password" />}
        <div className="form-field">
          <label>Bit depth (LSBs per sample)</label>
          <select value={bitDepth} onChange={(e) => setBitDepth(Number(e.target.value))}>
            {[1, 2, 3, 4].map((bd) => (
              <option key={bd} value={bd}>
                {bd}-bit {bd === 1 ? "(most imperceptible)" : bd === 4 ? "(highest capacity, more audible noise)" : ""}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="page__actions">
        <button className="btn btn--primary" onClick={handleEmbed} disabled={busy}>
          {busy ? "Embedding..." : "Embed & Generate Stego Audio"}
        </button>
        {resultBlob && (
          <button className="btn btn--secondary" onClick={handleDownload}>
            Download Stego WAV
          </button>
        )}
      </div>
    </div>
  );
}
