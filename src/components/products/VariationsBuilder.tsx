
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

export type VariationOption = {
  name: string;
  values: string[];
};

type VariationsBuilderProps = {
  options: VariationOption[];
  onChange: (next: VariationOption[]) => void;
};

const VariationsBuilder: React.FC<VariationsBuilderProps> = ({ options, onChange }) => {
  const addOption = () => {
    onChange([...options, { name: "", values: [""] }]);
  };

  const removeOption = (idx: number) => {
    const next = options.filter((_, i) => i !== idx);
    onChange(next);
  };

  const setOptionName = (idx: number, name: string) => {
    const next = [...options];
    next[idx] = { ...next[idx], name };
    onChange(next);
  };

  const setValue = (optIdx: number, valIdx: number, value: string) => {
    const next = [...options];
    const values = [...next[optIdx].values];
    values[valIdx] = value;
    next[optIdx] = { ...next[optIdx], values };
    onChange(next);
  };

  const addValue = (optIdx: number) => {
    const next = [...options];
    next[optIdx] = { ...next[optIdx], values: [...next[optIdx].values, ""] };
    onChange(next);
  };

  const removeValue = (optIdx: number, valIdx: number) => {
    const next = [...options];
    next[optIdx] = { ...next[optIdx], values: next[optIdx].values.filter((_, i) => i !== valIdx) };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {options.map((opt, idx) => (
        <div key={idx} className="border rounded-md p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label>Option name (e.g., Size, Color)</Label>
              <Input
                value={opt.name}
                onChange={(e) => setOptionName(idx, e.target.value)}
                placeholder="Option name"
              />
            </div>
            <Button type="button" variant="outline" onClick={() => removeOption(idx)}>
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>

          <div>
            <Label>Values</Label>
            <div className="space-y-2">
              {opt.values.map((v, vIdx) => (
                <div key={vIdx} className="flex items-center gap-2">
                  <Input
                    value={v}
                    onChange={(e) => setValue(idx, vIdx, e.target.value)}
                    placeholder="e.g., S, M, L or Black, White"
                  />
                  <Button type="button" variant="outline" onClick={() => removeValue(idx, vIdx)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => addValue(idx)}>
                <Plus className="h-4 w-4 mr-2" />
                Add value
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addOption}>
        <Plus className="h-4 w-4 mr-2" />
        Add option
      </Button>
    </div>
  );
};

export default VariationsBuilder;
