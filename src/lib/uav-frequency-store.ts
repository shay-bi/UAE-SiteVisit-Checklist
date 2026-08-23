import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { FieldValue } from "firebase-admin/firestore";
import { FIRESTORE, getDb } from "@/lib/firebase/admin";
import { migrateHomeToFacility } from "@/lib/stations";
import {
  DEFAULT_UAV_FREQUENCY_ROWS,
  type UavFrequencyProposal,
  type UavFrequencyRow,
} from "@/lib/uav-frequency-table";

function migrateRows(rows: UavFrequencyRow[]): UavFrequencyRow[] {
  return rows.map((row) => ({
    ...row,
    location: migrateHomeToFacility(row.location),
  }));
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "uav-frequency.json");
const PROPOSALS_FILE = path.join(DATA_DIR, "uav-frequency-proposals.json");

type GlobalStore = {
  __airoboticsUavFrequency?: UavFrequencyRow[];
  __airoboticsUavProposals?: UavFrequencyProposal[];
};

function memoryStore(): UavFrequencyRow[] {
  const g = globalThis as typeof globalThis & GlobalStore;
  if (!g.__airoboticsUavFrequency) {
    g.__airoboticsUavFrequency = [...DEFAULT_UAV_FREQUENCY_ROWS];
  }
  return g.__airoboticsUavFrequency;
}

function proposalMemory(): UavFrequencyProposal[] {
  const g = globalThis as typeof globalThis & GlobalStore;
  if (!g.__airoboticsUavProposals) {
    g.__airoboticsUavProposals = [];
  }
  return g.__airoboticsUavProposals;
}

async function readRowsFromDisk(): Promise<UavFrequencyRow[] | null> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as UavFrequencyRow[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeRowsToDisk(rows: UavFrequencyRow[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
}

async function readProposalsFromDisk(): Promise<UavFrequencyProposal[] | null> {
  try {
    const raw = await readFile(PROPOSALS_FILE, "utf8");
    const parsed = JSON.parse(raw) as UavFrequencyProposal[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeProposalsToDisk(
  proposals: UavFrequencyProposal[],
): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(PROPOSALS_FILE, JSON.stringify(proposals, null, 2), "utf8");
}

async function getRowsFromFile(): Promise<UavFrequencyRow[]> {
  const fromDisk = await readRowsFromDisk();
  if (fromDisk && fromDisk.length > 0) {
    memoryStore().splice(0, memoryStore().length, ...fromDisk);
    return [...fromDisk];
  }
  return [...memoryStore()];
}

async function saveRowsToFile(rows: UavFrequencyRow[]): Promise<void> {
  memoryStore().splice(0, memoryStore().length, ...rows);
  try {
    await writeRowsToDisk(rows);
  } catch (error) {
    console.error("Failed to persist UAV table to disk:", error);
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
    await db.collection(FIRESTORE.settings).doc(FIRESTORE.uavFrequencyDoc).set({
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
    return migrateRows(await getRowsFromFirestore());
  } catch (error) {
    console.error("Firestore getUavFrequencyRows failed:", error);
    return migrateRows(await getRowsFromFile());
  }
}

export async function saveUavFrequencyRows(
  rows: UavFrequencyRow[],
  updatedBy?: string,
): Promise<void> {
  try {
    await saveRowsToFirestore(rows, updatedBy);
  } catch (error) {
    console.error("Firestore saveUavFrequencyRows failed:", error);
    await saveRowsToFile(rows);
  }
}

async function listProposalsFromFile(): Promise<UavFrequencyProposal[]> {
  const fromDisk = await readProposalsFromDisk();
  if (fromDisk) {
    proposalMemory().splice(0, proposalMemory().length, ...fromDisk);
    return [...fromDisk];
  }
  return [...proposalMemory()];
}

async function saveProposalsToFile(
  proposals: UavFrequencyProposal[],
): Promise<void> {
  proposalMemory().splice(0, proposalMemory().length, ...proposals);
  try {
    await writeProposalsToDisk(proposals);
  } catch (error) {
    console.error("Failed to persist UAV proposals to disk:", error);
  }
}

export async function listPendingProposals(): Promise<UavFrequencyProposal[]> {
  const db = getDb();
  if (db) {
    try {
      const snapshot = await db
        .collection(FIRESTORE.uavFrequencyProposals)
        .where("status", "==", "pending")
        .get();
      return snapshot.docs
        .map((doc) => doc.data() as UavFrequencyProposal)
        .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
    } catch (error) {
      console.error("Firestore listPendingProposals failed:", error);
    }
  }

  const all = await listProposalsFromFile();
  return all
    .filter((p) => p.status === "pending")
    .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

export async function createProposal(input: {
  rows: UavFrequencyRow[];
  proposedByName: string;
  proposedByEmail: string;
  note?: string;
}): Promise<UavFrequencyProposal> {
  const proposal: UavFrequencyProposal = {
    id: randomUUID(),
    status: "pending",
    rows: input.rows,
    proposedByName: input.proposedByName.trim(),
    proposedByEmail: input.proposedByEmail.trim().toLowerCase(),
    note: (input.note ?? "").trim(),
    createdAtIso: new Date().toISOString(),
  };

  const db = getDb();
  if (db) {
    try {
      await db
        .collection(FIRESTORE.uavFrequencyProposals)
        .doc(proposal.id)
        .set(proposal);
      return proposal;
    } catch (error) {
      console.error("Firestore createProposal failed:", error);
    }
  }

  const all = await listProposalsFromFile();
  await saveProposalsToFile([proposal, ...all]);
  return proposal;
}

export async function getProposal(
  id: string,
): Promise<UavFrequencyProposal | null> {
  const db = getDb();
  if (db) {
    try {
      const doc = await db
        .collection(FIRESTORE.uavFrequencyProposals)
        .doc(id)
        .get();
      if (doc.exists) return doc.data() as UavFrequencyProposal;
    } catch (error) {
      console.error("Firestore getProposal failed:", error);
    }
  }

  const all = await listProposalsFromFile();
  return all.find((p) => p.id === id) ?? null;
}

export async function updateProposal(
  proposal: UavFrequencyProposal,
): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      await db
        .collection(FIRESTORE.uavFrequencyProposals)
        .doc(proposal.id)
        .set(proposal);
      return;
    } catch (error) {
      console.error("Firestore updateProposal failed:", error);
    }
  }

  const all = await listProposalsFromFile();
  const next = [proposal, ...all.filter((p) => p.id !== proposal.id)];
  await saveProposalsToFile(next);
}
