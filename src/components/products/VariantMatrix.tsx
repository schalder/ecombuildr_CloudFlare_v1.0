import React, { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MediaSelector } from "@/components/page-builder/components/MediaSelector";

export type VariationOption = {
  name: string;
  values: string[];
};

export type VariantEntry = {
  id: string; // stable key
  options: Record<string, string>;
  price?: number | null; // override price
  compare_price?: number | null; // override compare price
  image?: string | null; // variant-specific image
};

function combinations(options: VariationOption[]): Record<string, string>[] {
  if (!options.length) return [];
  const [first, ...rest] = options;
  const tailCombos = combinations(rest);
  if (rest.length === 0) {
    return (first.values || []).filter(Boolean).map((v) => ({ [first.name]: v }));
  }
  const result: Record<string, string>[] = [];
  (first.values || []).filter(Boolean).forEach((v) => {
    tailCombos.forEach((combo) => {
      result.push({ [first.name]: v, ...combo });
    });
  });
  return result;
}

function comboId(obj: Record<string, string>): string {
  // stable id from sorted keys
  const entries = Object.entries(obj).sort(([a],[b]) => a.localeCompare(b));
  return entries.map(([k,v]) => `${k}=${v}`).join("|");
}

type VariantMatrixProps = {
  options: VariationOption[];
  variants: VariantEntry[];
  onChange: (next: VariantEntry[]) => void;
};

const VariantMatrix: React.FC<VariantMatrixProps> = ({ options, variants, onChange }) => {
  const combos = useMemo(() => combinations(options.filter(o => o.name && (o.values||[]).length > 0)), [options]);

  // Keep variants in sync with combos
  useEffect(() => {
    const map = new Map(variants.map((v) => [v.id, v]));
    const next = combos.map((c) => {
      const id = comboId(c);
      const existing = map.get(id);
      return existing || { id, options: c, price: null };
    });
    if (JSON.stringify(next.map(n=>n.id)) !== JSON.stringify(variants.map(v=>v.id))) {
      onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combos]);

  const updatePrice = (id: string, price: string) => {
    const next = variants.map((v) => (v.id === id ? { ...v, price: price === "" ? null : Number(price) } : v));
    onChange(next);
  };

  const updateComparePrice = (id: string, comparePrice: string) => {
    const next = variants.map((v) => (v.id === id ? { ...v, compare_price: comparePrice === "" ? null : Number(comparePrice) } : v));
    onChange(next);
  };

  const updateImage = (id: string, image: string) => {
    const next = variants.map((v) => (v.id === id ? { ...v, image: image === "" ? null : image } : v));
    onChange(next);
  };

  if (combos.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variant Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Set optional price overrides for each variant. Leave blank to use the base product price.</p>
        <Separator />
        <div className="space-y-4">
          {variants.map((v) => (
            <div key={v.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border border-border rounded-lg">
              <div className="text-sm">
                <Label>Variant</Label>
                <div className="mt-1 text-foreground">
                  {Object.entries(v.options).map(([k, val]) => (
                    <span key={k} className="mr-2">
                      <span className="text-muted-foreground">{k}:</span> {val}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Price override</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={v.price ?? ""}
                    onChange={(e) => updatePrice(v.id, e.target.value)}
                    placeholder="Leave blank to use base price"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Compare at price override</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={v.compare_price ?? ""}
                    onChange={(e) => updateComparePrice(v.id, e.target.value)}
                    placeholder="Leave blank to use base compare price"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Variant image (optional)</Label>
                  <MediaSelector
                    value={v.image ?? ""}
                    onChange={(image) => updateImage(v.id, image)}
                    label=""
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VariantMatrix;
