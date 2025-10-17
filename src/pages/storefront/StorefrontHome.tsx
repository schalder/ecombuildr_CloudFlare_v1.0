import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { StorefrontFallback } from '@/components/storefront/StorefrontFallback';
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
  const { slug, websiteId, websiteSlug } = useParams<{ slug?: string; websiteId?: string; websiteSlug?: string }>();
  const { store, loadStore, loadStoreById } = useStore();
  const { addItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [homepage, setHomepage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const isWebsiteContext = Boolean(websiteId || websiteSlug);

  useEffect(() => {
    const init = async () => {
      if (slug) {
        loadStore(slug);
      } else if (websiteId) {
        const { data: website } = await supabase
          .from('websites')
          .select('store_id')
          .eq('id', websiteId)
          .single();
        if (website?.store_id) {
          await loadStoreById(website.store_id);
        }
      } else if (websiteSlug) {
        const { data: website } = await supabase
          .from('websites')
          .select('store_id')
          .eq('slug', websiteSlug)
          .single();
        if (website?.store_id) {
          await loadStoreById(website.store_id);
        }
      }
    };
    init();
  }, [slug, websiteId, websiteSlug, loadStore, loadStoreById]);

  useEffect(() => {
    if (store?.id) {
      fetchHomepage();
      fetchFeaturedProducts();
    }
  }, [store?.id]);

  const fetchHomepage = async () => {
    if (!store) return;
    
    try {
      console.log('StorefrontHome: Fetching homepage for store:', store.id);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_homepage', true)
        .eq('is_published', true)
        .maybeSingle();

      if (error) {
        console.error('StorefrontHome: Error fetching homepage:', error);
        return;
      }

      console.log('StorefrontHome: Homepage data:', data);
      setHomepage(data);
    } catch (error) {
      console.error('StorefrontHome: Error fetching homepage:', error);
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
    const content = (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Store not found</h1>
        </div>
      </div>
    );

    return content;
  }

  // Check if there's a custom homepage
  if (homepage) {
    console.log('StorefrontHome: Rendering custom homepage:', homepage.title);
    console.log('StorefrontHome: Homepage content:', homepage.content);
    
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

    const content = (
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
    );

    return content;
  }

  // Fallback: No homepage found
  const content = <StorefrontFallback />;

  return content;
};