export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function stripHtmlTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

export function extractMetaContent(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return undefined;
}

export function extractTitleTag(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? stripHtmlTags(match[1]) : undefined;
}

export function extractH1(html: string): string | undefined {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match?.[1] ? stripHtmlTags(match[1]) : undefined;
}

export function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim()) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object") results.push(item as Record<string, unknown>);
        }
      } else if (parsed && typeof parsed === "object") {
        results.push(parsed as Record<string, unknown>);
      }
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }
  return results;
}

export function extractNextData(html: string): unknown | null {
  const match = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

export function extractScriptJsonBlobs(html: string): unknown[] {
  const blobs: unknown[] = [];
  const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const content = match[1].trim();
    if (!content.startsWith("{") && !content.startsWith("[")) continue;
    try {
      blobs.push(JSON.parse(content));
    } catch {
      // not JSON
    }
  }
  return blobs;
}

export function findDeepValues(
  root: unknown,
  keys: string[],
  maxDepth = 8
): unknown[] {
  const found: unknown[] = [];
  const seen = new Set<unknown>();

  function walk(node: unknown, depth: number) {
    if (depth > maxDepth || node == null || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }

    const record = node as Record<string, unknown>;
    for (const key of keys) {
      if (key in record && record[key] != null) found.push(record[key]);
    }
    for (const value of Object.values(record)) {
      walk(value, depth + 1);
    }
  }

  walk(root, 0);
  return found;
}
