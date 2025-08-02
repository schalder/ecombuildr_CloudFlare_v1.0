import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { ThemeRenderer } from '@/components/storefront/ThemeRenderer';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  short_description?: string;
  images: string[];
  slug: string;
  is_active: boolean;
}

interface PageData {
  id: string;
  title: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
}

export const StorefrontHome: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { store, loadStore } = useStore();
  const { addItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [homepage, setHomepage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadStore(slug);
    }
  }, [slug, loadStore]);

  useEffect(() => {
    if (store?.id) {
      fetchHomepage();
      fetchFeaturedProducts();
    }
  }, [store?.id]);

  const fetchHomepage = async () => {
    if (!store) return;
    
    try {
      const { data } = await supabase
        .from('pages')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_homepage', true)
        .eq('is_published', true)
        .maybeSingle();

      setHomepage(data);
    } catch (error) {
      console.error('Error fetching homepage:', error);
    }
  };


  const fetchFeaturedProducts = async () => {
    if (!store) return;
    
    try {
      setLoading(true);
      console.log('Fetching products for store:', store.id);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, description, short_description, price, compare_price, images, is_active')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .limit(8);

      console.log('Products query result:', { data, error });

      if (error) {
        console.error('Products query error:', error);
        setFeaturedProducts([]);
        return;
      }
      
      const products = data?.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images.filter(img => typeof img === 'string') as string[] : [],
      })) || [];
      
      console.log('Processed products:', products);
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: `${product.id}-default`,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
  };

  if (!store) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Store not found</h1>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <ThemeRenderer />
    </StorefrontLayout>
  );
};