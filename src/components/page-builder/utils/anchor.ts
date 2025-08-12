// Utilities to generate short, human-friendly anchor IDs for the page builder
// Formats:
// - Section: section-XXXXXXXXXX
// - Row: row-XXXXXXXXXX
// - Column: col-XXXXXXXXXX
// - Element: <element-type>-XXXXXXXX

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';

export function generateShortId(len: number = 10): string {
  let out = '';
  const n = ALPHABET.length;
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * n)];
  }
  return out;
}

export function sectionAnchor(): string {
  return `section-${generateShortId(10)}`;
}

export function rowAnchor(): string {
  return `row-${generateShortId(10)}`;
}

export function columnAnchor(): string {
  return `col-${generateShortId(10)}`;
}

export function elementAnchor(type: string): string {
  const safeType = (type || 'el').toString().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `${safeType}-${generateShortId(8)}`;
}

export function normalizeAnchorValue(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.startsWith('#') ? value.slice(1) : value;
}
