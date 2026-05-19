// Single source of truth for which emails can sign into /admin and call any
// admin server action or API route. Keep in sync with firestore.rules — that
// file uses Firebase Security Rules syntax so the list is duplicated there.

export const ADMIN_EMAILS = [
  "tay@life-time.co",
  "taytoddpattison@gmail.com",
] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ADMIN_EMAILS as readonly string[]).includes(email);
}
