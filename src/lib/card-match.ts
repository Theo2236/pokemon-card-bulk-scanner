/** Collector number uit "025/165", "25/198" of "TG25". */
export function parseCollectorNumber(value?: string): string | undefined {
  if (!value?.trim()) return undefined;

  const primary = value.trim().split("/")[0]?.trim();
  if (!primary) return undefined;

  if (/^\d+$/.test(primary)) {
    return primary.replace(/^0+/, "") || "0";
  }

  return primary.toUpperCase();
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function setNamesMatch(detectedSet?: string, apiSet?: string): boolean {
  if (!detectedSet || !apiSet) return false;
  if (detectedSet.trim().toLowerCase() === apiSet.trim().toLowerCase()) return true;

  const a = normalizeText(detectedSet);
  const b = normalizeText(apiSet);
  if (a === b) return true;

  const numericToken = detectedSet.match(/\b(\d{2,4})\b/)?.[1];
  if (numericToken && b.includes(numericToken)) return true;

  const words = detectedSet
    .toLowerCase()
    .replace(/&/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4);

  if (words.length >= 2 && words.every((word) => apiSet.toLowerCase().includes(word))) {
    return true;
  }

  return false;
}

export function numbersMatch(detectedNumber?: string, apiNumber?: string): boolean {
  const left = parseCollectorNumber(detectedNumber);
  const right = parseCollectorNumber(apiNumber);
  if (!left || !right) return false;
  return left.toLowerCase() === right.toLowerCase();
}

export function extractSetToken(setName?: string): string | undefined {
  if (!setName?.trim()) return undefined;

  const trimmed = setName.trim();
  const numeric = trimmed.match(/\b(\d{2,4})\b/);
  if (numeric) return numeric[1];

  const normalized = normalizeText(trimmed);
  return normalized.length >= 3 ? normalized : undefined;
}
