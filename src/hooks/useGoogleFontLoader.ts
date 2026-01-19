export function ensureGoogleFontLoaded(family: string, weights: string = '400;500;600;700') {
  if (typeof document === 'undefined') return;
  const familyId = family.replace(/\s+/g, '-');
  const weightsId = weights.replace(/[^0-9]+/g, '-');
  const id = `gf-${familyId}-${weightsId}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  const encodedFamily = family.trim().replace(/\s+/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}
