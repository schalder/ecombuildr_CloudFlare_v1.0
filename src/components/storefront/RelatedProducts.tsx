
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
};

type RelatedProductsProps = {
  categoryId?: string | null;
  currentProductId: string;
  limit?: number;
};

export const RelatedProducts: React.FC<RelatedProductsProps> = ({ categoryId, currentProductId, limit = 8 }) => {
  const { store } = useStore();
  const [items, setItems] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!store || !categoryId) {
        setItems([]);
        return;
      }
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, images")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .eq("category_id", categoryId)
        .neq("id", currentProductId)
        .limit(limit);

      if (error) {
        console.error("Failed to load related products:", error);
      } else {
        const parsed = (data || []).map((p: any) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images.filter((img: any) => typeof img === "string") : [],
        })) as Product[];
        setItems(parsed);
      }
    };
    load();
  }, [store, categoryId, currentProductId, limit]);

  if (!categoryId || items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Related Products</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((p) => (
          <Card key={p.id} className="cursor-pointer" onClick={() => navigate(`../${p.slug}`)}>
            <CardContent className="p-3 space-y-2">
              <div className="aspect-square rounded bg-muted overflow-hidden">
                <img src={p.images?.[0] || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground">{formatCurrency(p.price)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
