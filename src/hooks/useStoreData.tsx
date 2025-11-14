import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from './useUserStore';
import { useStore as useStoreContext } from '@/contexts/StoreContext';

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
  action_buttons?: any;
  allowed_payment_methods?: string[] | null;
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
  websiteId?: string;
  skipShowOnWebsiteFilter?: boolean; // When true, don't filter by show_on_website (for funnel checkout product selection)
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { store: userStore } = useUserStore();
  const { store: storefrontStore } = useStoreContext();
  const store = storefrontStore || userStore;

  const fetchProducts = useCallback(async () => {
    if (!store) {
      setLoading(false);
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      
      // If websiteId is provided, filter by website visibility
      if (options?.websiteId) {
        // When specificProductIds is provided (products already selected for funnel),
        // skip website visibility filtering and fetch products directly by their IDs
        // This ensures products with show_on_website = false can be used in funnels
        if (options?.specificProductIds && options.specificProductIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Type instantiation is excessively deep (known Supabase type inference limitation)
          let query = supabase
            .from('products')
            .select('*')
            .eq('store_id', store.id)
            .eq('is_active', true)
            .in('id', options.specificProductIds)
            .order('created_at', { ascending: false });

          // Filter by categories
          if (options?.categoryIds && options.categoryIds.length > 0) {
            query = (query as any).in('category_id', options.categoryIds);
          }

          // Apply limit
          if (options?.limit) {
            query = (query as any).limit(options.limit);
          }

          const { data, error } = await query;

          if (error) {
            setError(error.message);
            return;
          }

          setProducts(data as Product[] || []);
          return;
        }

        // For general product listing (no specificProductIds), use website visibility filtering
        const { data: visibleProductIds } = await supabase
          .from('product_website_visibility')
          .select('product_id')
          .eq('website_id', options.websiteId);

        const productIds = visibleProductIds?.map(v => v.product_id) || [];
        
        // If no products are visible on this website, return empty array
        if (productIds.length === 0) {
          setProducts([]);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Type instantiation is excessively deep (known Supabase type inference limitation)
        let query = supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_active', true);
        
        // Only filter by show_on_website if skipShowOnWebsiteFilter is NOT true
        // (for website storefront pages, we want to filter by show_on_website)
        if (!options?.skipShowOnWebsiteFilter) {
          query = (query as any).eq('show_on_website', true);
        }
        
        query = (query as any).in('id', productIds).order('created_at', { ascending: false });

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
      } else {
        // Original logic for when no website filtering is needed
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [store, options?.categoryIds, options?.limit, options?.specificProductIds, options?.websiteId, options?.skipShowOnWebsiteFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};

export const useStoreCategories = (websiteId?: string) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { store: userStore } = useUserStore();
  const { store: storefrontStore } = useStoreContext();
  const store = storefrontStore || userStore;

  const fetchCategories = useCallback(async () => {
    if (!store) {
      setLoading(false);
      setCategories([]);
      return;
    }

    try {
      setLoading(true);
      
      // If websiteId is provided, filter by website visibility
      if (websiteId) {
        const { data: visibleCategoryIds } = await supabase
          .from('category_website_visibility')
          .select('category_id')
          .eq('website_id', websiteId);

        const categoryIds = visibleCategoryIds?.map(v => v.category_id) || [];
        
        // If no categories are visible on this website, return empty array
        if (categoryIds.length === 0) {
          setCategories([]);
          return;
        }

        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', store.id)
          .in('id', categoryIds)
          .order('name');

        if (error) {
          setError(error.message);
          return;
        }

        setCategories(data || []);
      } else {
        // Original logic for when no website filtering is needed
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [store, websiteId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
};

export const useProductById = (productId?: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { store: userStore } = useUserStore();
  const { store: storefrontStore } = useStoreContext();
  const store = storefrontStore || userStore;

  const fetchProduct = useCallback(async () => {
    if (!store || !productId) {
      setLoading(false);
      setProduct(null);
      return;
    }

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