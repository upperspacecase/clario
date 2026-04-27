import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | undefined;

function init(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set");
  }
  const credentials = JSON.parse(raw);
  app = initializeApp({
    credential: cert(credentials),
    projectId: credentials.project_id,
  });
  return app;
}

export function adminDb(): Firestore {
  return getFirestore(init());
}

export function adminAuth(): Auth {
  return getAuth(init());
}
