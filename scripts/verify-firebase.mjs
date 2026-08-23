import { readFileSync } from "fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DEFAULT_UAV_FREQUENCY_ROWS } from "../src/lib/uav-frequency-table.ts";

function loadServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) return JSON.parse(json);
  return JSON.parse(readFileSync(".firebase-service-account.json", "utf8"));
}

async function main() {
  if (!getApps().length) {
    initializeApp({ credential: cert(loadServiceAccount()) });
  }

  const db = getFirestore();
  const ref = db.collection("settings").doc("uavFrequency");
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      rows: DEFAULT_UAV_FREQUENCY_ROWS,
      seededAt: new Date().toISOString(),
    });
    console.log(
      "Seeded UAV frequency table with",
      DEFAULT_UAV_FREQUENCY_ROWS.length,
      "rows",
    );
    return;
  }

  const rows = snap.data()?.rows ?? [];
  console.log("Firestore connected. Existing UAV rows:", rows.length);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
