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
  addr: { city?: string }
): number | undefined {
  if (!settings || !settings.enabled) return undefined;

  const city = normalize(addr.city);
  if (city) {
    const match = settings.cityRules.find((r) => normalize(r.city) === city);
    if (match) return Number(match.fee) || 0;
  }
  return Number(settings.restOfCountryFee) || 0;
}
