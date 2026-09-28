import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, FolderKanban } from "lucide-react";
import { db } from "../../database/db";
import { projectsRepository } from "../../database/repositories/projectsRepository";
import { useNotify } from "../../context/NotificationContext";

const PROJECT_TYPES = ["image", "audio", "mixed", "general"];

export default function ProjectsPage() {
  const projects = useLiveQuery(() => db.projects.orderBy("updatedAt").reverse().toArray(), [], []);
  const [name, setName] = useState("");
  const [type, setType] = useState("general");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const project = await projectsRepository.create({ name: name.trim(), type });
      setName("");
      notify.success("Project created.");
      navigate(`/projects/${project.id}`);
    } catch (e) {
      notify.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>
          <FolderKanban size={22} /> Projects
        </h1>
        <p className="page__subtitle">Group related steganography and encryption work together.</p>
      </div>

      <section className="panel">
        <h2 className="panel__title">New project</h2>
        <form className="inline-form" onSubmit={handleCreate}>
          <input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button className="btn btn--primary" type="submit" disabled={creating}>
            <Plus size={16} /> Create
          </button>
        </form>
      </section>

      <section className="panel">
        <h2 className="panel__title">All projects</h2>
        {projects.length === 0 ? (
          <p className="empty-state">No projects yet. Create one above to get started.</p>
        ) : (
          <ul className="list">
            {projects.map((p) => (
              <li key={p.id} className="list__item list__item--clickable" onClick={() => navigate(`/projects/${p.id}`)}>
                <div>
                  <div className="list__item-title">{p.name}</div>
                  <div className="list__item-meta">
                    {p.type} · updated {new Date(p.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`badge badge--${p.status === "active" ? "success" : "neutral"}`}>{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
