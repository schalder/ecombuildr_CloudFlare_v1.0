import { PageBuilderData, PageBuilderSection, PageBuilderRow, PageBuilderColumn, PageBuilderElement } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomBase62(length = 10): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    return Array.from(arr, (n) => ALPHABET[n % ALPHABET.length]).join('');
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return out;
}

export function sanitizeTypePrefix(type: string): string {
  return (type || '')
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '') || 'element';
}

export function buildAnchor(kind: 'section' | 'row' | 'col' | 'element', elementType?: string): string {
  if (kind === 'element') {
    const prefix = sanitizeTypePrefix(elementType || 'element');
    return `${prefix}-${randomBase62(10)}`;
  }
  const prefix = kind === 'col' ? 'col' : kind; // "col" exactly as requested
  return `${prefix}-${randomBase62(10)}`;
}

export function ensureAnchors(data: PageBuilderData): PageBuilderData {
  const used = new Set<string>();

  const ensureUnique = (candidate: string): string => {
    let anchor = candidate;
    while (used.has(anchor)) anchor = anchor.replace(/-[A-Za-z0-9]+$/, `-${randomBase62(10)}`);
    used.add(anchor);
    return anchor;
  };

  const clone: PageBuilderData = {
    ...data,
    sections: (data.sections || []).map((section) => {
      const s: PageBuilderSection = {
        ...section,
        anchor: ensureUnique(section.anchor || buildAnchor('section')),
        rows: (section.rows || []).map((row) => {
          const r: PageBuilderRow = {
            ...row,
            anchor: ensureUnique(row.anchor || buildAnchor('row')),
            columns: (row.columns || []).map((col) => {
              const c: PageBuilderColumn = {
                ...col,
                anchor: ensureUnique(col.anchor || buildAnchor('col')),
                elements: (col.elements || []).map((el) => {
                  const e: PageBuilderElement = {
                    ...el,
                    anchor: ensureUnique(el.anchor || buildAnchor('element', el.type)),
                  };
                  return e;
                }),
              };
              return c;
            }),
          };
          return r;
        }),
      };
      return s;
    }),
  };

  return clone;
}
