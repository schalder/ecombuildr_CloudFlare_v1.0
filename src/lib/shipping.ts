// Shipping utilities and types
// Define per-website shipping rules and compute fees for an address

export type ShippingCityRule = {
  city: string;
  fee: number;
  label?: string;
};

export type ShippingSettings = {
  enabled: boolean;
  country?: string; // ISO name or display name
  restOfCountryFee: number;
  cityRules: ShippingCityRule[];
};

function normalize(str?: string) {
  return (str || '').trim().toLowerCase();
}

export function computeShippingForAddress(
  settings: ShippingSettings | undefined,
  addr: { city?: string; area?: string; address?: string; postal?: string }
): number | undefined {
  if (!settings || !settings.enabled) return undefined;

  const city = normalize(addr.city);
  const area = normalize(addr.area);
  const address = normalize(addr.address);

  // 1) Exact city match
  if (city) {
    const match = settings.cityRules.find((r) => normalize(r.city) === city);
    if (match) return Number(match.fee) || 0;
  }

  // 2) Fallback: substring match of rule city within area or address
  const haystacks = [area, address].filter(Boolean) as string[];
  if (haystacks.length) {
    const found = settings.cityRules.find((r) => {
      const ruleCity = normalize(r.city);
      return ruleCity && haystacks.some((h) => h.includes(ruleCity));
    });
    if (found) return Number(found.fee) || 0;
  }

  // 3) Rest of country fallback
  return Number(settings.restOfCountryFee) || 0;
}

