import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { debounce } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'product' | 'order' | 'customer';
  url: string;
}

export function useSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!user || !searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Get user's store first
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      if (!store) return;

      const searchResults: SearchResult[] = [];

      // Search products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, sku, price')
        .eq('store_id', store.id)
        .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      if (products) {
        searchResults.push(...products.map(product => ({
          id: product.id,
          title: product.name,
          subtitle: `SKU: ${product.sku || 'N/A'} • $${product.price}`,
          type: 'product' as const,
          url: `/dashboard/products/edit/${product.id}`,
        })));
      }

      // Search orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, total, status')
        .eq('store_id', store.id)
        .or(`order_number.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`)
        .limit(5);

      if (orders) {
        searchResults.push(...orders.map(order => ({
          id: order.id,
          title: `Order #${order.order_number}`,
          subtitle: `${order.customer_name} • $${order.total} • ${order.status}`,
          type: 'order' as const,
          url: '/dashboard/orders',
        })));
      }

      // Search customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, total_orders')
        .eq('store_id', store.id)
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(5);

      if (customers) {
        searchResults.push(...customers.map(customer => ({
          id: customer.id,
          title: customer.full_name,
          subtitle: `${customer.email || customer.phone || ''} • ${customer.total_orders} orders`,
          type: 'customer' as const,
          url: '/dashboard/customers',
        })));
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      performSearch(searchQuery);
    }, 300),
    [performSearch]
  );

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setLoading(false);
  }, []);

  return {
    query,
    results,
    loading,
    handleSearch,
    clearSearch,
  };
}