import React, { useState } from "react";
import { ShieldCheck, Trash2, Download } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { vaultRepository } from "../../database/repositories/projectsRepository";
import Dropzone from "../../components/forms/Dropzone";
import PasswordField from "../../components/forms/PasswordField";
import { encryptBytes, decryptBytes } from "../../services/cryptoService";
import { downloadBlob, formatBytes, bytesToBlob, inferMimeFromName } from "../../services/fileService";
import { useNotify } from "../../context/NotificationContext";

export default function VaultPage() {
  const items = useLiveQuery(() => vaultRepository.list(), [], []);
  const notify = useNotify();
  const [file, setFile] = useState(null);
  const [savePassword, setSavePassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [openPasswords, setOpenPasswords] = useState({});

  const handleSave = async () => {
    if (!file) return notify.error("Choose a file to save to the vault.");
    if (!savePassword) return notify.error("Enter a password to encrypt this item.");
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const encrypted = await encryptBytes(bytes, savePassword);
      await vaultRepository.add({
        projectId: null,
        name: file.name,
        kind: file.type || inferMimeFromName(file.name),
        size: file.size,
        data: Array.from(encrypted), // store as plain array for IndexedDB structured clone safety
      });
      setFile(null);
      setSavePassword("");
      notify.success("Saved to local vault (encrypted).");
    } catch (e) {
      notify.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async (item) => {
    const password = openPasswords[item.id];
    if (!password) return notify.error("Enter the password for this item.");
    try {
      const bytes = new Uint8Array(item.data);
      const decrypted = await decryptBytes(bytes, password);
      downloadBlob(bytesToBlob(decrypted, item.kind), item.name);
      notify.success("Unlocked and downloaded.");
    } catch (e) {
      notify.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    await vaultRepository.remove(id);
    notify.success("Removed from vault.");
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>
          <ShieldCheck size={22} /> Vault
        </h1>
        <p className="page__subtitle">Save encrypted files locally in IndexedDB for safekeeping. Nothing here ever leaves this device.</p>
      </div>

      <section className="panel">
        <h2 className="panel__title">Add to vault</h2>
        <Dropzone onFile={setFile} hint={file ? `${file.name} (${formatBytes(file.size)})` : "Any file type"} />
        <PasswordField id="vault-password" label="Encryption password" value={savePassword} onChange={setSavePassword} showStrength autoComplete="new-password" />
        <div className="page__actions">
          <button className="btn btn--primary" onClick={handleSave} disabled={busy}>
            {busy ? "Saving..." : "Encrypt & Save to Vault"}
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Vault items</h2>
        {items.length === 0 ? (
          <p className="empty-state">Your vault is empty.</p>
        ) : (
          <ul className="list">
            {items.map((item) => (
              <li key={item.id} className="list__item list__item--stacked">
                <div className="list__item-row">
                  <div>
                    <div className="list__item-title">{item.name}</div>
                    <div className="list__item-meta">
                      {formatBytes(item.size)} · saved {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button className="icon-button" onClick={() => handleDelete(item.id)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="inline-form">
                  <input
                    type="password"
                    placeholder="Password to unlock"
                    value={openPasswords[item.id] || ""}
                    onChange={(e) => setOpenPasswords((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  />
                  <button className="btn btn--secondary" onClick={() => handleUnlock(item)}>
                    <Download size={16} /> Unlock & Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
