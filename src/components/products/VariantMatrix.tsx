import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown, ChevronUp, Image } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(true);
  const [accordionValue, setAccordionValue] = useState<string[]>([]);
  const combos = useMemo(() => combinations(options.filter(o => o.name && (o.values||[]).length > 0)), [options]);

  const expandAll = () => {
    setAccordionValue(variants.map(v => v.id));
  };

  const collapseAll = () => {
    setAccordionValue([]);
  };

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Variant Pricing</CardTitle>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="gap-2">
                <span className="text-sm text-muted-foreground">
                  {variants.length} variant{variants.length !== 1 ? 's' : ''}
                </span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Set optional price overrides for each variant. Leave blank to use the base product price.</p>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={expandAll}
                  className="text-xs"
                >
                  Expand all
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={collapseAll}
                  className="text-xs"
                >
                  Collapse all
                </Button>
              </div>
            </div>
            <Separator />
            <Accordion type="multiple" value={accordionValue} onValueChange={setAccordionValue}>
              {variants.map((v) => (
                <AccordionItem key={v.id} value={v.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="text-sm">
                          {Object.entries(v.options).map(([k, val]) => (
                            <span key={k} className="mr-2">
                              <span className="text-muted-foreground">{k}:</span> {val}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {v.price && (
                          <span>Price: ${v.price}</span>
                        )}
                        {v.compare_price && (
                          <span>Compare: ${v.compare_price}</span>
                        )}
                        {v.image && (
                          <Image className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default VariantMatrix;
