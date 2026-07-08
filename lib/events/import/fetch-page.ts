import { lookup } from "dns/promises";

const ALLOWED_HOSTS = new Set([
  "honarticket.com",
  "www.honarticket.com",
  "melotik.com",
  "www.melotik.com",
]);

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 8;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FETCH_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
};

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "127.0.0.1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true;
  return false;
}

function parseSetCookieLines(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

function mergeCookieHeader(existing: string, setCookieLines: string[]): string {
  const jar = new Map<string, string>();

  for (const part of existing.split("; ").filter(Boolean)) {
    const eq = part.indexOf("=");
    if (eq > 0) jar.set(part.slice(0, eq), part);
  }

  for (const line of setCookieLines) {
    const pair = line.split(";")[0]?.trim();
    if (!pair) continue;
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair);
  }

  return [...jar.values()].join("; ");
}

function wrapFetchError(error: unknown): Error {
  if (error instanceof Error && error.name === "AbortError") {
    return new Error("زمان دریافت صفحه به پایان رسید. دوباره تلاش کنید.");
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg === "fetch failed" || error.cause) {
      return new Error(
        "اتصال به سایت مبدأ برقرار نشد. اتصال اینترنت را بررسی کنید یا چند دقیقه بعد دوباره تلاش کنید."
      );
    }
    if (msg.includes("redirect")) {
      return new Error(
        "سایت مبدأ درخواست را مسدود کرد (حلقه ریدایرکت). دوباره تلاش کنید یا اطلاعات را دستی وارد کنید."
      );
    }
    return error;
  }
  return new Error("خطا در دریافت صفحه رویداد.");
}

async function assertSafeHost(hostname: string): Promise<void> {
  const lower = hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(lower)) {
    throw new Error("این دامنه برای import مجاز نیست.");
  }

  let addresses: string[];
  try {
    const result = await lookup(lower, { all: true });
    addresses = result.map((r) => r.address);
  } catch {
    throw new Error("دامنه قابل resolve نیست.");
  }

  for (const addr of addresses) {
    if (isPrivateIp(addr)) {
      throw new Error("آدرس مقصد مجاز نیست.");
    }
  }
}

export function normalizeImportUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("لینک رویداد الزامی است.");

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("لینک وارد شده معتبر نیست.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("فقط لینک http یا https پشتیبانی می‌شود.");
  }

  return parsed.toString();
}

export function detectProvider(url: string): "honarticket" | "melotik" | "generic" {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("honarticket")) return "honarticket";
  if (host.includes("melotik")) return "melotik";
  return "generic";
}

export async function fetchEventPage(url: string): Promise<{ html: string; finalUrl: string }> {
  const normalized = normalizeImportUrl(url);
  const parsed = new URL(normalized);
  await assertSafeHost(parsed.hostname);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let currentUrl = normalized;
    let cookieHeader = "";

    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          ...FETCH_HEADERS,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        redirect: "manual",
      });

      cookieHeader = mergeCookieHeader(cookieHeader, parseSetCookieLines(response.headers));

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error("ریدایرکت نامعتبر از سایت مبدأ دریافت شد.");
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new Error(`دریافت صفحه ناموفق بود (کد ${response.status}).`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (
        !contentType.includes("text/html") &&
        !contentType.includes("application/json") &&
        !contentType.includes("text/plain")
      ) {
        throw new Error("پاسخ دریافتی HTML نیست.");
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > MAX_HTML_BYTES) {
        throw new Error("حجم صفحه بیش از حد مجاز است.");
      }

      const html = new TextDecoder("utf-8").decode(buffer);
      return { html, finalUrl: response.url || currentUrl };
    }

    throw new Error("تعداد ریدایرکت‌های سایت مبدأ بیش از حد مجاز است.");
  } catch (error) {
    throw wrapFetchError(error);
  } finally {
    clearTimeout(timer);
  }
}
