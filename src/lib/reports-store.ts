import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { FIRESTORE, getDb } from "@/lib/firebase/admin";
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

function sortReports(reports: StoredReport[]): StoredReport[] {
  return [...reports].sort((a, b) =>
    b.submittedAtIso.localeCompare(a.submittedAtIso),
  );
}

async function listReportsFromFile(): Promise<StoredReport[]> {
  const fromDisk = await readFromDisk();
  if (fromDisk) {
    memoryStore().splice(0, memoryStore().length, ...fromDisk);
    return sortReports(fromDisk);
  }
  return sortReports([...memoryStore()]);
}

async function saveReportToFile(report: StoredReport): Promise<void> {
  const existing = (await readFromDisk()) ?? [...memoryStore()];
  const next = [report, ...existing.filter((r) => r.id !== report.id)];
  memoryStore().splice(0, memoryStore().length, ...next);
  try {
    await writeToDisk(next);
  } catch (error) {
    console.error("Failed to persist report to disk:", error);
  }
}

async function listReportsFromFirestore(): Promise<StoredReport[]> {
  const db = getDb();
  if (!db) return listReportsFromFile();

  const snapshot = await db
    .collection(FIRESTORE.reports)
    .orderBy("submittedAtIso", "desc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as StoredReport);
}

async function saveReportToFirestore(report: StoredReport): Promise<void> {
  const db = getDb();
  if (!db) {
    await saveReportToFile(report);
    return;
  }

  await db.collection(FIRESTORE.reports).doc(report.id).set(report);
}

export async function listReports(): Promise<StoredReport[]> {
  try {
    return await listReportsFromFirestore();
  } catch (error) {
    console.error("Firestore listReports failed, falling back to file store:", error);
    return listReportsFromFile();
  }
}

export async function saveReport(report: StoredReport): Promise<void> {
  try {
    await saveReportToFirestore(report);
  } catch (error) {
    console.error("Firestore saveReport failed, falling back to file store:", error);
    await saveReportToFile(report);
  }
}

export async function getLatestReportForEmail(
  email: string,
): Promise<StoredReport | null> {
  const normalized = email.trim().toLowerCase();
  const db = getDb();

  if (db) {
    try {
      const snapshot = await db
        .collection(FIRESTORE.reports)
        .where("employeeEmail", "==", normalized)
        .orderBy("submittedAtIso", "desc")
        .limit(1)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs[0]!.data() as StoredReport;
      }
      return null;
    } catch (error) {
      console.error(
        "Firestore getLatestReportForEmail failed, falling back to scan:",
        error,
      );
    }
  }

  const reports = await listReports();
  return (
    reports.find((r) => r.employeeEmail.trim().toLowerCase() === normalized) ??
    null
  );
}
