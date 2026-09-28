import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { History as HistoryIcon, Trash2 } from "lucide-react";
import { db } from "../../database/db";
import { operationsRepository } from "../../database/repositories/projectsRepository";
import { formatBytes } from "../../services/fileService";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import { useNotify } from "../../context/NotificationContext";

const FILTERS = ["all", "embed", "extract", "encrypt", "decrypt"];

export default function HistoryPage() {
  const [filter, setFilter] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const notify = useNotify();
  const operations = useLiveQuery(() => db.operations.orderBy("createdAt").reverse().toArray(), [], []);

  const filtered = filter === "all" ? operations : operations.filter((o) => o.operationType === filter);

  const handleClear = async () => {
    await operationsRepository.clear();
    notify.success("History cleared.");
    setConfirmOpen(false);
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>
          <HistoryIcon size={22} /> History
        </h1>
        <p className="page__subtitle">Detailed local log of every operation performed in StegaVault.</p>
      </div>

      <section className="panel">
        <div className="tab-switch">
          {FILTERS.map((f) => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="empty-state">No operations recorded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Media</th>
                <th>File</th>
                <th>Size</th>
                <th>Algorithm</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((op) => (
                <tr key={op.id}>
                  <td>{op.operationType}</td>
                  <td>{op.mediaType}</td>
                  <td>{op.fileName || "—"}</td>
                  <td>{formatBytes(op.fileSize || 0)}</td>
                  <td>{op.algorithm || "—"}</td>
                  <td>
                    <span className={`badge ${op.success ? "badge--success" : "badge--error"}`}>{op.success ? "Success" : "Failed"}</span>
                  </td>
                  <td>{new Date(op.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="page__actions">
          <button className="btn btn--danger" onClick={() => setConfirmOpen(true)} disabled={operations.length === 0}>
            <Trash2 size={16} /> Clear history
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Clear all history?"
        message="This permanently deletes the operation history stored on this device."
        confirmLabel="Clear"
        danger
        onConfirm={handleClear}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
