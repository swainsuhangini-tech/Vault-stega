// src/database/db.js
//
// IndexedDB is the primary persistence layer for StegaVault, via Dexie.
// Nothing here ever touches the network — this is purely local storage.

import Dexie from "dexie";

export const db = new Dexie("StegaVaultDB");

db.version(1).stores({
  // ++id = auto-increment primary key
  projects: "++id, name, type, status, createdAt, updatedAt",
  operations: "++id, projectId, operationType, mediaType, success, createdAt",
  settings: "id",
  drafts: "++id, projectId, type, createdAt, updatedAt",
  vaultItems: "++id, projectId, name, kind, createdAt",
});

// Ensure a single settings row always exists (id: 1).
db.on("populate", () => {
  db.settings.put({
    id: 1,
    theme: "dark",
    autoSave: true,
    confirmDelete: true,
    defaultAlgorithm: "AES-256-GCM",
    defaultBitDepth: 1,
    defaultAudioChannelMode: "interleaved",
  });
});

// If the DB already existed from a previous session but somehow lacks the
// settings row (e.g. cleared manually), backfill it on open.
export async function ensureSettingsRow() {
  const existing = await db.settings.get(1);
  if (!existing) {
    await db.settings.put({
      id: 1,
      theme: "dark",
      autoSave: true,
      confirmDelete: true,
      defaultAlgorithm: "AES-256-GCM",
      defaultBitDepth: 1,
      defaultAudioChannelMode: "interleaved",
    });
  }
}

export async function estimateStorageUsage() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage: usage || 0, quota: quota || 0 };
    } catch (e) {
      return { usage: 0, quota: 0 };
    }
  }
  return { usage: 0, quota: 0 };
}
