import { createHmac } from "crypto";

export { hashPassword, verifyPassword } from "@/lib/auth/password";

export {
  getMyEventPublicUrl,
  getMyEventEventHref,
  getMyEventOrganizerHomeHref,
  getMyEventPagesDomain,
  isMyEventSubdomainHost,
  isMyEventPublicHost,
  extractOrganizerSlugFromHost,
  formatMyEventEventLinkPreview,
} from "./domains";

export { resolveEventPublicUrl, assignUniquePublicSlugs } from "./store";

const SESSION_COOKIE = "my_event_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

function getSessionSecret(): string {
  return process.env.MY_EVENT_SESSION_SECRET ?? "dev-my-event-secret-change-me";
}

export type MyEventSession = {
  userId: number;
  organizerId: number;
  issuedAt: number;
};

export function createSessionToken(
  session: Omit<MyEventSession, "issuedAt">
): string {
  const issuedAt = Date.now();
  const payload = `${session.userId}:${session.organizerId}:${issuedAt}`;
  const signature = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function parseSessionToken(token: string): MyEventSession | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;

    const [userId, organizerId, issuedAt, signature] = parts;
    const payload = `${userId}:${organizerId}:${issuedAt}`;
    const expected = createHmac("sha256", getSessionSecret())
      .update(payload)
      .digest("hex");

    if (signature !== expected) return null;

    const issued = Number(issuedAt);
    if (!Number.isFinite(issued) || Date.now() - issued > SESSION_MAX_AGE_MS) {
      return null;
    }

    return {
      userId: Number(userId),
      organizerId: Number(organizerId),
      issuedAt: issued,
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_MAX_AGE_MS };

export function normalizeMyEventSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function isValidMyEventSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(slug);
}
