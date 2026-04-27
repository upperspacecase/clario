import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
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

  // Two supported credential sources:
  //   1) FIREBASE_SERVICE_ACCOUNT_KEY — raw JSON, used on Fly (deployed server).
  //   2) GOOGLE_APPLICATION_CREDENTIALS — path to a JSON keyfile, used locally
  //      by assess-cli and the GetHours skill pipeline.
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    const credentials = JSON.parse(raw);
    app = initializeApp({
      credential: cert(credentials),
      projectId: credentials.project_id,
    });
    return app;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    app = initializeApp({
      credential: applicationDefault(),
      ...(projectId ? { projectId } : {}),
    });
    return app;
  }

  throw new Error(
    "Firebase admin credentials missing — set FIREBASE_SERVICE_ACCOUNT_KEY (deployed) or GOOGLE_APPLICATION_CREDENTIALS (local)",
  );
}

export function adminDb(): Firestore {
  return getFirestore(init());
}

export function adminAuth(): Auth {
  return getAuth(init());
}
