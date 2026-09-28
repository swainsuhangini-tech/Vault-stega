// src/services/exportService.js — export/import of the full local vault as an
// encrypted backup container, and export of individual encrypted payload
// containers (independent of any steganography — "Encrypt" page output).

import { db } from "../database/db";
import { encryptBytes, decryptBytes } from "./cryptoService";
import { downloadBlob } from "./fileService";

/** Export the entire local database (minus large vault blobs, which are exported alongside) as an encrypted JSON backup. */
export async function exportBackup(password) {
  const [projects, operations, settings, drafts, vaultItems] = await Promise.all([
    db.projects.toArray(),
    db.operations.toArray(),
    db.settings.toArray(),
    db.drafts.toArray(),
    db.vaultItems.toArray(),
  ]);

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: { projects, operations, settings, drafts, vaultItems },
  };

  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);

  if (password) {
    const encrypted = await encryptBytes(bytes, password);
    downloadBlob(new Blob([encrypted]), `stegavault-backup-${Date.now()}.svbackup`);
  } else {
    downloadBlob(new Blob([json], { type: "application/json" }), `stegavault-backup-${Date.now()}.json`);
  }
}

export async function importBackup(file, password) {
  const buffer = await file.arrayBuffer();
  let bytes = new Uint8Array(buffer);

  if (file.name.endsWith(".svbackup")) {
    if (!password) throw new Error("This backup is encrypted — a password is required to import it.");
    bytes = await decryptBytes(bytes, password);
  }

  const json = new TextDecoder().decode(bytes);
  const payload = JSON.parse(json);

  if (!payload.tables) throw new Error("Invalid backup file format.");

  await db.transaction("rw", db.projects, db.operations, db.settings, db.drafts, db.vaultItems, async () => {
    const { projects = [], operations = [], settings = [], drafts = [], vaultItems = [] } = payload.tables;
    await db.projects.bulkPut(projects);
    await db.operations.bulkPut(operations);
    if (settings.length) await db.settings.bulkPut(settings);
    await db.drafts.bulkPut(drafts);
    await db.vaultItems.bulkPut(vaultItems);
  });

  return payload;
}

export function exportEncryptedContainer(containerBytes, filename) {
  downloadBlob(new Blob([containerBytes]), filename || `stegavault-container-${Date.now()}.svenc`);
}
