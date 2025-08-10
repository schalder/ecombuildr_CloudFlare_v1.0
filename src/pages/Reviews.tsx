import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  is_visible: boolean;
  created_at: string;
}

interface Product { id: string; name: string; }

export default function Reviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productFilter, setProductFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    loadProducts();
    loadReviews();
  }, [user]);

  const loadProducts = async () => {
    // Fetch products owned by user (RLS on products allows store owners to manage)
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .order('name');
    if (!error && data) setProducts(data as any);
  };

  const loadReviews = async () => {
    setLoading(true);
    let q = supabase
      .from('product_reviews')
      .select('id, product_id, reviewer_name, rating, title, comment, is_visible, created_at')
      .order('created_at', { ascending: false });
    if (productFilter !== 'all') {
      q = q.eq('product_id', productFilter);
    }
    const { data, error } = await q;
    if (error) {
      console.error(error);
    } else {
      setReviews((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFilter]);

  const toggleVisibility = async (id: string, value: boolean) => {
    const { error } = await supabase
      .from('product_reviews')
      .update({ is_visible: value })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update visibility', variant: 'destructive' });
    } else {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_visible: value } : r)));
      toast({ title: 'Updated', description: 'Visibility updated' });
    }
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete review', variant: 'destructive' });
    } else {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast({ title: 'Deleted', description: 'Review removed' });
    }
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return reviews.filter((r) =>
      r.reviewer_name.toLowerCase().includes(term) ||
      (r.title || '').toLowerCase().includes(term) ||
      (r.comment || '').toLowerCase().includes(term)
    );
  }, [reviews, search]);

  const productName = (id: string) => products.find((p) => p.id === id)?.name || 'Unknown';

  return (
    <DashboardLayout title="Reviews" description="Moderate product reviews submitted by customers">
      <Card>
        <CardHeader>
          <CardTitle>Moderation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Filter by product</Label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Search</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, title or comment" />
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">No reviews found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{productName(r.product_id)}</TableCell>
                      <TableCell>{r.reviewer_name}</TableCell>
                      <TableCell>{'⭐'.repeat(r.rating)}</TableCell>
                      <TableCell className="max-w-[280px] truncate">{r.title || '-'}</TableCell>
                      <TableCell>
                        <Switch checked={r.is_visible} onCheckedChange={(v) => toggleVisibility(r.id, v)} />
                      </TableCell>
                      <TableCell>{format(new Date(r.created_at), 'PP p')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => deleteReview(r.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
