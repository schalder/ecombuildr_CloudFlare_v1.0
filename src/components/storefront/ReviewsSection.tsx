
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { toast } from "sonner";

type Review = {
  id: string;
  reviewer_name: string;
  reviewer_email?: string | null;
  reviewer_phone?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  created_at: string;
};

type ReviewsSectionProps = {
  productId: string;
};

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    rating: 5,
    title: "",
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) * 10) / 10;
  }, [reviews]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id, reviewer_name, reviewer_email, reviewer_phone, rating, title, comment, created_at")
      .eq("product_id", productId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load reviews:", error);
    } else {
      setReviews((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.rating) {
      toast.error("Please provide your name and rating");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      reviewer_name: form.name,
      reviewer_email: form.email || null,
      reviewer_phone: form.phone || null,
      rating: Number(form.rating),
      title: form.title || null,
      comment: form.comment || null,
    });

    if (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review");
    } else {
      toast.success("Thank you! Your review has been submitted.");
      setForm({
        name: "",
        email: "",
        phone: "",
        rating: 5,
        title: "",
        comment: "",
      });
      load();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer Reviews</span>
            <span className="text-sm text-muted-foreground">
              {reviews.length > 0 ? `Average ${average} / 5 (${reviews.length} review${reviews.length > 1 ? "s" : ""})` : "No reviews yet"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground">Be the first to review this product.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.reviewer_name}</div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={i < r.rating ? "h-4 w-4 fill-yellow-400 text-yellow-400" : "h-4 w-4 text-muted-foreground"} />
                      ))}
                    </div>
                  </div>
                  {r.title && <div className="mt-1 font-semibold">{r.title}</div>}
                  {r.comment && <div className="mt-1 text-sm text-muted-foreground">{r.comment}</div>}
                  <div className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Write a review</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-name">Name</Label>
              <Input id="r-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-email">Email</Label>
              <Input id="r-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-phone">Phone</Label>
              <Input id="r-phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-rating">Rating (1-5)</Label>
              <Input
                id="r-rating"
                type="number"
                min={1}
                max={5}
                value={form.rating}
                onChange={(e) => setForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="r-title">Title</Label>
              <Input id="r-title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="r-comment">Comment</Label>
              <Textarea id="r-comment" rows={4} value={form.comment} onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsSection;
