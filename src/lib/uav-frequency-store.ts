import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { FieldValue } from "firebase-admin/firestore";
import { FIRESTORE, getDb } from "@/lib/firebase/admin";
import {
  DEFAULT_UAV_FREQUENCY_ROWS,
  type UavFrequencyRow,
} from "@/lib/uav-frequency-table";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "uav-frequency.json");

type GlobalStore = {
  __airoboticsUavFrequency?: UavFrequencyRow[];
};

function memoryStore(): UavFrequencyRow[] {
  const g = globalThis as typeof globalThis & GlobalStore;
  if (!g.__airoboticsUavFrequency) {
    g.__airoboticsUavFrequency = [...DEFAULT_UAV_FREQUENCY_ROWS];
  }
  return g.__airoboticsUavFrequency;
}

async function readFromDisk(): Promise<UavFrequencyRow[] | null> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as UavFrequencyRow[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeToDisk(rows: UavFrequencyRow[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
}

async function getRowsFromFile(): Promise<UavFrequencyRow[]> {
  const fromDisk = await readFromDisk();
  if (fromDisk && fromDisk.length > 0) {
    memoryStore().splice(0, memoryStore().length, ...fromDisk);
    return [...fromDisk];
  }
  return [...memoryStore()];
}

async function saveRowsToFile(rows: UavFrequencyRow[]): Promise<void> {
  memoryStore().splice(0, memoryStore().length, ...rows);
  try {
    await writeToDisk(rows);
  } catch (error) {
    console.error("Failed to persist UAV frequency table to disk:", error);
  }
}

async function getRowsFromFirestore(): Promise<UavFrequencyRow[]> {
  const db = getDb();
  if (!db) return getRowsFromFile();

  const doc = await db
    .collection(FIRESTORE.settings)
    .doc(FIRESTORE.uavFrequencyDoc)
    .get();

  if (!doc.exists) {
    await db
      .collection(FIRESTORE.settings)
      .doc(FIRESTORE.uavFrequencyDoc)
      .set({
        rows: DEFAULT_UAV_FREQUENCY_ROWS,
        updatedAt: FieldValue.serverTimestamp(),
      });
    return [...DEFAULT_UAV_FREQUENCY_ROWS];
  }

  const data = doc.data() as { rows?: UavFrequencyRow[] };
  if (Array.isArray(data.rows) && data.rows.length > 0) {
    return data.rows;
  }

  return [...DEFAULT_UAV_FREQUENCY_ROWS];
}

async function saveRowsToFirestore(
  rows: UavFrequencyRow[],
  updatedBy?: string,
): Promise<void> {
  const db = getDb();
  if (!db) {
    await saveRowsToFile(rows);
    return;
  }

  await db.collection(FIRESTORE.settings).doc(FIRESTORE.uavFrequencyDoc).set({
    rows,
    updatedAt: FieldValue.serverTimestamp(),
    ...(updatedBy ? { updatedBy } : {}),
  });
}

export async function getUavFrequencyRows(): Promise<UavFrequencyRow[]> {
  try {
    return await getRowsFromFirestore();
  } catch (error) {
    console.error(
      "Firestore getUavFrequencyRows failed, falling back to file store:",
      error,
    );
    return getRowsFromFile();
  }
}

export async function saveUavFrequencyRows(
  rows: UavFrequencyRow[],
  updatedBy?: string,
): Promise<void> {
  try {
    await saveRowsToFirestore(rows, updatedBy);
  } catch (error) {
    console.error(
      "Firestore saveUavFrequencyRows failed, falling back to file store:",
      error,
    );
    await saveRowsToFile(rows);
  }
}
