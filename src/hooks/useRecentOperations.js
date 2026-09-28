import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../database/db";

export function useRecentOperations(limit = 8) {
  return useLiveQuery(() => db.operations.orderBy("createdAt").reverse().limit(limit).toArray(), [limit], []);
}
