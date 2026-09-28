import { estimateStorageUsage } from "../database/db";
import { db } from "../database/db";

export async function getStorageSummary() {
  const { usage, quota } = await estimateStorageUsage();
  const [projectCount, operationCount, vaultCount] = await Promise.all([
    db.projects.count(),
    db.operations.count(),
    db.vaultItems.count(),
  ]);
  return { usage, quota, projectCount, operationCount, vaultCount };
}

export async function clearAllLocalData() {
  await db.transaction("rw", db.projects, db.operations, db.drafts, db.vaultItems, async () => {
    await db.projects.clear();
    await db.operations.clear();
    await db.drafts.clear();
    await db.vaultItems.clear();
  });
}
