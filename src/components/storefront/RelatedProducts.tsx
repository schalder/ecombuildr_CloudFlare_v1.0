
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { ProductCard } from "@/components/storefront/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useProductReviewStats } from "@/hooks/useProductReviewStats";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  short_description?: string;
  images: string[];
  is_active: boolean;
};

type RelatedProductsProps = {
  categoryId?: string | null;
  currentProductId: string;
  limit?: number;
};

export const RelatedProducts: React.FC<RelatedProductsProps> = ({ categoryId, currentProductId, limit = 8 }) => {
const { store } = useStore();
const [items, setItems] = useState<Product[]>([]);
const { addItem } = useCart();
const { toast } = useToast();

// Get review stats for all related products
const productIds = items.map(p => p.id);
const { reviewStats } = useProductReviewStats(productIds);

const handleAddToCart = (p: Product) => {
  addItem({ id: p.id, productId: p.id, name: p.name, price: p.price, quantity: 1, image: p.images?.[0] });
  toast({ title: "Added to cart", description: `${p.name} added to cart.` });
};

  useEffect(() => {
    const load = async () => {
      if (!store || !categoryId) {
        setItems([]);
        return;
      }
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_price, short_description, images, is_active")
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => {
          const stats = reviewStats[p.id];
          return (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={handleAddToCart}
              ratingAverage={stats?.rating_average || 0}
              ratingCount={stats?.rating_count || 0}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;
