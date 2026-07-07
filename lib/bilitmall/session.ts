import { cookies } from "next/headers";
import {
  BILITMALL_SESSION_COOKIE,
  BILITMALL_SESSION_MAX_AGE_MS,
  parseBilitmallSessionToken,
  type BilitmallSession,
} from "./auth";

export async function getBilitmallSession(): Promise<BilitmallSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(BILITMALL_SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseBilitmallSessionToken(token);
}

export async function setBilitmallSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(BILITMALL_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: BILITMALL_SESSION_MAX_AGE_MS / 1000,
  });
}

export async function clearBilitmallSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(BILITMALL_SESSION_COOKIE);
}
