import { adminAuth } from "@/lib/firebase-admin";
import { isAdminEmail } from "@/lib/admin-emails";

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireAdmin(req: Request): Promise<{ uid: string; email: string }> {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    throw new AdminAuthError("Missing bearer token", 401);
  }
  const token = header.slice(7).trim();
  if (!token) throw new AdminAuthError("Missing bearer token", 401);

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch {
    throw new AdminAuthError("Invalid token", 401);
  }

  if (!isAdminEmail(decoded.email) || decoded.email_verified !== true) {
    throw new AdminAuthError("Forbidden", 403);
  }

  return { uid: decoded.uid, email: decoded.email! };
}
