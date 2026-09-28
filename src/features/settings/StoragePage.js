import React, { useEffect, useState } from "react";
import { HardDrive, Trash2, Download, Upload } from "lucide-react";
import { getStorageSummary, clearAllLocalData } from "../../services/storageService";
import { exportBackup, importBackup } from "../../services/exportService";
import { formatBytes } from "../../services/fileService";
import PasswordField from "../../components/forms/PasswordField";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import { useNotify } from "../../context/NotificationContext";

export default function StoragePage() {
  const [summary, setSummary] = useState(null);
  const [backupPassword, setBackupPassword] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importPassword, setImportPassword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const notify = useNotify();

  const refresh = async () => setSummary(await getStorageSummary());

  useEffect(() => {
    refresh();
  }, []);

  const handleExport = async () => {
    try {
      await exportBackup(backupPassword || undefined);
      notify.success("Backup downloaded.");
    } catch (e) {
      notify.error(e.message);
    }
  };

  const handleImport = async () => {
    if (!importFile) return notify.error("Choose a backup file to import.");
    try {
      await importBackup(importFile, importPassword || undefined);
      notify.success("Backup imported.");
      refresh();
    } catch (e) {
      notify.error(e.message);
    }
  };

  const handleClear = async () => {
    await clearAllLocalData();
    notify.success("All local data cleared.");
    setConfirmOpen(false);
    refresh();
  };

  if (!summary) return null;

  const usagePercent = summary.quota ? Math.min(100, (summary.usage / summary.quota) * 100) : 0;

  return (
    <div className="page">
      <div className="page__header">
        <h1>
          <HardDrive size={22} /> Storage
        </h1>
        <p className="page__subtitle">Everything below is stored locally in this browser's IndexedDB.</p>
      </div>

      <section className="panel">
        <h2 className="panel__title">Usage</h2>
        <div className="capacity-bar">
          <div className="capacity-bar__fill" style={{ width: `${usagePercent}%` }} />
        </div>
        <p className="capacity-label">
          {formatBytes(summary.usage)} used {summary.quota ? `of ~${formatBytes(summary.quota)} available` : ""}
        </p>
        <div className="stat-grid">
          <div className="stat">
            <div className="stat__value">{summary.projectCount}</div>
            <div className="stat__label">Projects</div>
          </div>
          <div className="stat">
            <div className="stat__value">{summary.operationCount}</div>
            <div className="stat__label">Operations</div>
          </div>
          <div className="stat">
            <div className="stat__value">{summary.vaultCount}</div>
            <div className="stat__label">Saved files</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Export backup</h2>
        <p>Optionally encrypt the backup with a password. Leave blank for an unencrypted JSON export.</p>
        <PasswordField id="backup-password" label="Backup password (optional)" value={backupPassword} onChange={setBackupPassword} autoComplete="new-password" />
        <div className="page__actions">
          <button className="btn btn--secondary" onClick={handleExport}>
            <Download size={16} /> Export backup
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Import backup</h2>
        <input type="file" accept=".svbackup,.json" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
        <PasswordField id="import-password" label="Backup password (if encrypted)" value={importPassword} onChange={setImportPassword} autoComplete="current-password" />
        <div className="page__actions">
          <button className="btn btn--secondary" onClick={handleImport}>
            <Upload size={16} /> Import backup
          </button>
        </div>
      </section>

      <section className="panel panel--danger">
        <h2 className="panel__title">Danger zone</h2>
        <p>Permanently delete all projects, history, drafts, and vault items from this device.</p>
        <button className="btn btn--danger" onClick={() => setConfirmOpen(true)}>
          <Trash2 size={16} /> Clear all local data
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Clear all local data?"
        message="This permanently deletes all projects, history, drafts, and vault items stored on this device. This cannot be undone."
        confirmLabel="Clear everything"
        danger
        onConfirm={handleClear}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
