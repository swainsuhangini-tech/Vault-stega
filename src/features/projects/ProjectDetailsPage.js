import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../database/db";
import { projectsRepository, operationsRepository } from "../../database/repositories/projectsRepository";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import { useNotify } from "../../context/NotificationContext";

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const project = useLiveQuery(() => db.projects.get(Number(projectId)), [projectId]);
  const operations = useLiveQuery(() => operationsRepository.listForProject(projectId), [projectId], []);
  const [description, setDescription] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (project === undefined) return null;
  if (project === null) {
    return (
      <div className="page">
        <p className="empty-state">Project not found. It may have been deleted.</p>
      </div>
    );
  }

  const desc = description === null ? project.description || "" : description;

  const handleSaveDescription = async () => {
    await projectsRepository.update(project.id, { description: desc });
    notify.success("Project updated.");
  };

  const handleDelete = async () => {
    await projectsRepository.remove(project.id);
    notify.success("Project deleted.");
    navigate("/projects");
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>{project.name}</h1>
        <p className="page__subtitle">
          {project.type} · created {new Date(project.createdAt).toLocaleString()}
        </p>
      </div>

      <section className="panel">
        <h2 className="panel__title">Description</h2>
        <textarea className="textarea" rows={4} value={desc} onChange={(e) => setDescription(e.target.value)} />
        <div className="page__actions">
          <button className="btn btn--secondary" onClick={handleSaveDescription}>
            Save
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Operations in this project</h2>
        {operations.length === 0 ? (
          <p className="empty-state">No operations linked to this project yet.</p>
        ) : (
          <ul className="list">
            {operations.map((op) => (
              <li key={op.id} className="list__item">
                <div>
                  <div className="list__item-title">
                    {op.operationType} — {op.mediaType}
                  </div>
                  <div className="list__item-meta">{new Date(op.createdAt).toLocaleString()}</div>
                </div>
                <span className={`badge ${op.success ? "badge--success" : "badge--error"}`}>{op.success ? "Success" : "Failed"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel panel--danger">
        <h2 className="panel__title">Danger zone</h2>
        <p>Deleting a project removes it and its linked history permanently from this device.</p>
        <button className="btn btn--danger" onClick={() => setConfirmOpen(true)}>
          Delete project
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete project?"
        message={`This will permanently delete "${project.name}" and its history from this device.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
