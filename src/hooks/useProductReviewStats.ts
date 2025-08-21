import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductReviewStats {
  product_id: string;
  rating_average: number;
  rating_count: number;
}

export const useProductReviewStats = (productIds: string[]) => {
  const [reviewStats, setReviewStats] = useState<Record<string, ProductReviewStats>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productIds || productIds.length === 0) {
      setReviewStats({});
      return;
    }

    const fetchReviewStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.rpc('get_review_stats_for_products', {
          product_ids: productIds
        });

        if (error) throw error;

        const statsMap: Record<string, ProductReviewStats> = {};
        data?.forEach((stat: any) => {
          statsMap[stat.product_id] = {
            product_id: stat.product_id,
            rating_average: parseFloat(stat.rating_average) || 0,
            rating_count: parseInt(stat.rating_count) || 0,
          };
        });

        setReviewStats(statsMap);
      } catch (err) {
        console.error('Error fetching review stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch review stats');
      } finally {
        setLoading(false);
      }
    };

    fetchReviewStats();
  }, [productIds.join(',')]);

  return { reviewStats, loading, error };
};