import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { ThemeRenderer } from '@/components/storefront/ThemeRenderer';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';

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
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_homepage', true)
        .eq('is_published', true)
        .maybeSingle();

      if (error) {
        return;
      }

      setHomepage(data);
    } catch (error) {
      // Silent error handling
    }
  };


  const fetchFeaturedProducts = async () => {
    if (!store) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, description, short_description, price, compare_price, images, is_active')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .limit(8);

      if (error) {
        setFeaturedProducts([]);
        return;
      }
      
      const products = data?.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images.filter(img => typeof img === 'string') as string[] : [],
      })) || [];
      
      setFeaturedProducts(products);
    } catch (error) {
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

  // Check if there's a custom homepage
  if (homepage) {
    
    // Set up SEO metadata for custom homepage
    if (homepage.seo_title) {
      document.title = homepage.seo_title;
    }
    if (homepage.seo_description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', homepage.seo_description);
      }
    }

    return (
      <StorefrontLayout>
        <div className="w-full">
          {/* Render custom homepage with page builder */}
          {homepage.content?.sections ? (
            <PageBuilderRenderer data={homepage.content} />
          ) : (
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold mb-6">{homepage.title}</h1>
              <p className="text-muted-foreground">This homepage is still being set up.</p>
              <p className="text-sm text-muted-foreground mt-4">
                Content structure: {JSON.stringify(Object.keys(homepage.content || {}), null, 2)}
              </p>
            </div>
          )}
        </div>
      </StorefrontLayout>
    );
  }

  // Default theme renderer if no custom homepage
  return (
    <StorefrontLayout>
      <ThemeRenderer />
    </StorefrontLayout>
  );
};