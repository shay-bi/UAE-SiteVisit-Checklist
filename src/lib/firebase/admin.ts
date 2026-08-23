import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cachedDb: Firestore | null | undefined;

function parseServiceAccount():
  | { projectId: string; clientEmail: string; privateKey: string }
  | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json) as {
        project_id?: string;
        projectId?: string;
        client_email?: string;
        clientEmail?: string;
        private_key?: string;
        privateKey?: string;
      };
      const projectId = parsed.project_id ?? parsed.projectId;
      const clientEmail = parsed.client_email ?? parsed.clientEmail;
      const privateKey = parsed.private_key ?? parsed.privateKey;
      if (projectId && clientEmail && privateKey) {
        return { projectId, clientEmail, privateKey };
      }
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  return parseServiceAccount() !== null;
}

function getOrInitApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) return null;

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

/** Firestore client, or null when Firebase env vars are not set. */
export function getDb(): Firestore | null {
  if (cachedDb !== undefined) return cachedDb;

  const app = getOrInitApp();
  cachedDb = app ? getFirestore(app) : null;
  return cachedDb;
}

export const FIRESTORE = {
  reports: "reports",
  settings: "settings",
  uavFrequencyDoc: "uavFrequency",
  uavFrequencyProposals: "uavFrequencyProposals",
  rateLimits: "rateLimits",
} as const;
