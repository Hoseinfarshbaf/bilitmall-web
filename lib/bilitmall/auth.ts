import { createHmac } from "crypto";

export const BILITMALL_SESSION_COOKIE = "bilitmall_session";
export const BILITMALL_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

function getSessionSecret(): string {
  return (
    process.env.BILITMALL_SESSION_SECRET ??
    process.env.MY_EVENT_SESSION_SECRET ??
    "dev-bilitmall-secret-change-me"
  );
}

export type BilitmallSession = {
  userId: number;
  issuedAt: number;
};

export function createBilitmallSessionToken(
  session: Omit<BilitmallSession, "issuedAt">
): string {
  const issuedAt = Date.now();
  const payload = `${session.userId}:${issuedAt}`;
  const signature = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function parseBilitmallSessionToken(token: string): BilitmallSession | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;

    const [userId, issuedAt, signature] = parts;
    const payload = `${userId}:${issuedAt}`;
    const expected = createHmac("sha256", getSessionSecret())
      .update(payload)
      .digest("hex");

    if (signature !== expected) return null;

    const issued = Number(issuedAt);
    if (!Number.isFinite(issued) || Date.now() - issued > BILITMALL_SESSION_MAX_AGE_MS) {
      return null;
    }

    return {
      userId: Number(userId),
      issuedAt: issued,
    };
  } catch {
    return null;
  }
}
