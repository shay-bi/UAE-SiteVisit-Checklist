import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
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

export async function getUavFrequencyRows(): Promise<UavFrequencyRow[]> {
  const fromDisk = await readFromDisk();
  if (fromDisk && fromDisk.length > 0) {
    memoryStore().splice(0, memoryStore().length, ...fromDisk);
    return [...fromDisk];
  }
  return [...memoryStore()];
}

export async function saveUavFrequencyRows(
  rows: UavFrequencyRow[],
): Promise<void> {
  memoryStore().splice(0, memoryStore().length, ...rows);
  try {
    await writeToDisk(rows);
  } catch (error) {
    console.error("Failed to persist UAV frequency table to disk:", error);
  }
}
