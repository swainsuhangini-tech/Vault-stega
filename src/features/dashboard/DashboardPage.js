import React from "react";
import { ImageIcon, AudioLines, Lock, Unlock, FileText, Clock } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../database/db";
import { useAuth } from "../../app/providers/AuthProvider";
import StatusCard from "../../components/cards/StatusCard";
import ActionCard from "../../components/cards/ActionCard";
import { useRecentOperations } from "../../hooks/useRecentOperations";
import { formatBytes } from "../../services/fileService";

export default function DashboardPage() {
  const { user, firebaseConfigured } = useAuth();
  const recentOps = useRecentOperations(6);
  const projectCount = useLiveQuery(() => db.projects.count(), [], 0);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Welcome{user?.displayName ? `, ${user.displayName}` : ""}</h1>
          <p className="page__subtitle">Everything below runs locally in your browser.</p>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel__title">Security status</h2>
        <div className="status-grid">
          <StatusCard label="Authentication" status={firebaseConfigured ? "Ready" : "Not configured"} tone={firebaseConfigured ? "good" : "warn"} />
          <StatusCard label="Local Storage" status="Ready" tone="good" />
          <StatusCard label="Encryption Engine" status="Ready (AES-256-GCM)" tone="good" />
          <StatusCard label="Image Engine" status="Ready" tone="good" />
          <StatusCard label="Audio Engine" status="Ready" tone="good" />
          <StatusCard label="Offline Mode" status={navigator.onLine ? "Online" : "Offline"} tone="good" />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Quick actions</h2>
        <div className="action-grid">
          <ActionCard icon={ImageIcon} title="Hide Message in Image" description="Embed encrypted data into a PNG." to="/image/embed" />
          <ActionCard icon={ImageIcon} title="Extract Message from Image" description="Recover and decrypt hidden data." to="/image/extract" />
          <ActionCard icon={AudioLines} title="Hide Message in Audio" description="Embed encrypted data into a WAV file." to="/audio/embed" />
          <ActionCard icon={AudioLines} title="Extract Message from Audio" description="Recover and decrypt hidden data." to="/audio/extract" />
          <ActionCard icon={Lock} title="Encrypt Text/File" description="Create a standalone encrypted container." to="/encrypt" />
          <ActionCard icon={Unlock} title="Decrypt Payload" description="Decrypt a container back to plaintext." to="/decrypt" />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">
          <Clock size={16} /> Recent activity
        </h2>
        {recentOps.length === 0 ? (
          <p className="empty-state">No operations yet. Your recent embed, extract, encrypt, and decrypt actions will show up here.</p>
        ) : (
          <ul className="activity-list">
            {recentOps.map((op) => (
              <li key={op.id} className="activity-list__item">
                <FileText size={16} />
                <div>
                  <div className="activity-list__title">
                    {op.operationType} — {op.mediaType}
                  </div>
                  <div className="activity-list__meta">
                    {op.fileName} · {formatBytes(op.fileSize || 0)} · {new Date(op.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className={`badge ${op.success ? "badge--success" : "badge--error"}`}>
                  {op.success ? "Success" : "Failed"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">Storage</h2>
        <p className="page__subtitle">{projectCount} project(s) saved locally. Visit Storage for a full breakdown.</p>
      </section>
    </div>
  );
}
