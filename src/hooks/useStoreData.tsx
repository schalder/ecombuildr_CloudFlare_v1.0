import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from './useUserStore';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number | null;
  images: any; // Json type from Supabase
  description?: string | null;
  short_description?: string | null;
  category_id?: string | null;
  sku?: string | null;
  is_active: boolean;
  inventory_quantity?: number | null;
  track_inventory: boolean;
  cost_price?: number | null;
  created_at: string;
  updated_at: string;
  store_id: string;
  variations?: any; // Json type from Supabase
  seo_title?: string | null;
  seo_description?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export const useStoreProducts = (options?: {
  categoryIds?: string[];
  limit?: number;
  specificProductIds?: string[];
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { store } = useUserStore();

  const fetchProducts = useCallback(async () => {
    if (!store) return;

    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Filter by specific product IDs
      if (options?.specificProductIds && options.specificProductIds.length > 0) {
        query = query.in('id', options.specificProductIds);
      }

      // Filter by categories
      if (options?.categoryIds && options.categoryIds.length > 0) {
        query = query.in('category_id', options.categoryIds);
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        return;
      }

      setProducts(data as Product[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [store, options?.categoryIds, options?.limit, options?.specificProductIds]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};

export const useStoreCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { store } = useUserStore();

  const fetchCategories = useCallback(async () => {
    if (!store) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .order('name');

      if (error) {
        setError(error.message);
        return;
      }

      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
};

export const useProductById = (productId?: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { store } = useUserStore();

  const fetchProduct = useCallback(async () => {
    if (!store || !productId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('store_id', store.id)
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setProduct(data as Product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [store, productId]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
};