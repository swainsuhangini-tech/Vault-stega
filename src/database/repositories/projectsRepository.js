import { db } from "../db";

export const projectsRepository = {
  async list() {
    return db.projects.orderBy("updatedAt").reverse().toArray();
  },
  async get(id) {
    return db.projects.get(Number(id));
  },
  async create({ name, type, description = "", metadata = {} }) {
    const now = new Date().toISOString();
    const id = await db.projects.add({
      name,
      type,
      description,
      createdAt: now,
      updatedAt: now,
      status: "active",
      metadata,
    });
    return db.projects.get(id);
  },
  async update(id, changes) {
    await db.projects.update(Number(id), { ...changes, updatedAt: new Date().toISOString() });
    return db.projects.get(Number(id));
  },
  async remove(id) {
    await db.transaction("rw", db.projects, db.operations, db.drafts, db.vaultItems, async () => {
      await db.projects.delete(Number(id));
      await db.operations.where("projectId").equals(Number(id)).delete();
      await db.drafts.where("projectId").equals(Number(id)).delete();
      await db.vaultItems.where("projectId").equals(Number(id)).delete();
    });
  },
};

export const operationsRepository = {
  async list(limit = 100) {
    return db.operations.orderBy("createdAt").reverse().limit(limit).toArray();
  },
  async listForProject(projectId) {
    return db.operations.where("projectId").equals(Number(projectId)).reverse().sortBy("createdAt");
  },
  async record(entry) {
    return db.operations.add({ ...entry, createdAt: new Date().toISOString() });
  },
  async clear() {
    return db.operations.clear();
  },
};

export const vaultRepository = {
  async list() {
    return db.vaultItems.orderBy("createdAt").reverse().toArray();
  },
  async add(item) {
    return db.vaultItems.add({ ...item, createdAt: new Date().toISOString() });
  },
  async remove(id) {
    return db.vaultItems.delete(Number(id));
  },
};

export const settingsRepository = {
  async get() {
    return db.settings.get(1);
  },
  async update(changes) {
    await db.settings.update(1, changes);
    return db.settings.get(1);
  },
};
