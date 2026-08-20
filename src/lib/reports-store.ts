import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { StoredReport } from "@/lib/report";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "reports.json");

type GlobalStore = {
  __airoboticsReports?: StoredReport[];
};

function memoryStore(): StoredReport[] {
  const g = globalThis as typeof globalThis & GlobalStore;
  if (!g.__airoboticsReports) {
    g.__airoboticsReports = [];
  }
  return g.__airoboticsReports;
}

async function readFromDisk(): Promise<StoredReport[] | null> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }
}

async function writeToDisk(reports: StoredReport[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(reports, null, 2), "utf8");
}

export async function listReports(): Promise<StoredReport[]> {
  const fromDisk = await readFromDisk();
  if (fromDisk) {
    memoryStore().splice(0, memoryStore().length, ...fromDisk);
    return [...fromDisk].sort((a, b) =>
      b.submittedAtIso.localeCompare(a.submittedAtIso),
    );
  }
  return [...memoryStore()].sort((a, b) =>
    b.submittedAtIso.localeCompare(a.submittedAtIso),
  );
}

export async function saveReport(report: StoredReport): Promise<void> {
  const existing = (await readFromDisk()) ?? [...memoryStore()];
  const next = [report, ...existing.filter((r) => r.id !== report.id)];
  memoryStore().splice(0, memoryStore().length, ...next);
  try {
    await writeToDisk(next);
  } catch (error) {
    console.error("Failed to persist report to disk:", error);
    // Memory store still holds the report for this process.
  }
}
