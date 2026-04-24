import { openDB, type IDBPDatabase } from "idb";
import type { Section } from "../timer/sectionTimer";

export interface SessionRecord {
  id?: number;
  timestamp: number;
  duration: number;
  fillerCounts: Record<string, number>;
  speedHistory: number[];
  pauseCount: number;
  sections: Section[];
}

const DB_NAME = "presentaion";
const STORE = "sessions";
const VERSION = 1;

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

export async function saveSession(record: Omit<SessionRecord, "id">): Promise<number> {
  const db = await getDB();
  return db.add(STORE, record) as Promise<number>;
}

export async function loadSessions(): Promise<SessionRecord[]> {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function deleteSession(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function clearSessions(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE);
}
