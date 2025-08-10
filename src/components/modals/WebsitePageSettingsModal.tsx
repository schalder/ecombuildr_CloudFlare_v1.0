import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WebsitePageSettingsModalProps {
  open: boolean;
  onClose: () => void;
  websiteId: string;
  page: {
    id: string;
    title: string;
    slug: string;
    is_published: boolean;
    is_homepage: boolean;
  } | null;
}

const getPublicUrlForPage = (
  origin: string,
  opts: { websiteId: string; slug?: string; domain?: string },
  page: { slug: string; is_homepage: boolean }
) => {
  const base = opts.domain
    ? `https://${opts.domain}`
    : opts.slug
    ? `/site/${opts.slug}`
    : `${origin}/website/${opts.websiteId}`;
  if (page.is_homepage) return base;
  const needsOrderId = page.slug === "order-confirmation" || page.slug === "payment-processing";
  return needsOrderId ? `${base}/${page.slug}?orderId=demo` : `${base}/${page.slug}`;
};

export const WebsitePageSettingsModal: React.FC<WebsitePageSettingsModalProps> = ({ open, onClose, websiteId, page }) => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(false);
  const [websiteMeta, setWebsiteMeta] = useState<{ slug?: string; domain?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('websites')
          .select('slug, domain')
          .eq('id', websiteId)
          .maybeSingle();
        setWebsiteMeta({ slug: (data as any)?.slug, domain: (data as any)?.domain });
      } catch {
        setWebsiteMeta(null);
      }
    })();
  }, [websiteId]);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setPublished(page.is_published);
    }
  }, [page]);

  const url = useMemo(() => {
    if (!page) return "";
    return getPublicUrlForPage(window.location.origin, { websiteId, slug: websiteMeta?.slug, domain: websiteMeta?.domain }, page);
  }, [page, websiteId, websiteMeta]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!page) return;
      const { error } = await supabase
        .from("website_pages")
        .update({ title, slug, is_published: published })
        .eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["website-pages", websiteId] });
      toast({ title: "Page updated" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to update page", description: err?.message ?? "", variant: "destructive" });
    },
  });

  const setHomepageMutation = useMutation({
    mutationFn: async () => {
      if (!page) return;
      const { error: clearErr } = await supabase
        .from("website_pages")
        .update({ is_homepage: false })
        .eq("website_id", websiteId);
      if (clearErr) throw clearErr;
      const { error: setErr } = await supabase
        .from("website_pages")
        .update({ is_homepage: true })
        .eq("id", page.id);
      if (setErr) throw setErr;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["website-pages", websiteId] });
      toast({ title: "Homepage updated" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to set homepage", description: err?.message ?? "", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!page) return;
      const { error } = await supabase
        .from("website_pages")
        .delete()
        .eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["website-pages", websiteId] });
      toast({ title: "Page deleted" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete page", description: err?.message ?? "", variant: "destructive" });
    },
  });

  const handleCopyUrl = async () => {
    if (!page) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "URL copied" });
    } catch {
      toast({ title: "Failed to copy URL", variant: "destructive" });
    }
  };

  const handleSave = () => updateMutation.mutate();
  const handleSetHomepage = () => setHomepageMutation.mutate();
  const handleDelete = () => {
    if (!page) return;
    if (confirm("Delete this page? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Page settings</DialogTitle>
          <DialogDescription>Update page details, publish status, and actions.</DialogDescription>
        </DialogHeader>

        {page && (
          <div className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="published" className="block">Published</Label>
                <p className="text-sm text-muted-foreground">Make this page publicly accessible.</p>
              </div>
              <Switch id="published" checked={published} onCheckedChange={setPublished} />
            </div>

            <div className="grid gap-2">
              <Label>Public URL</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={url} />
                <Button variant="outline" onClick={handleCopyUrl}>Copy</Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="secondary" onClick={handleSetHomepage} disabled={page.is_homepage || setHomepageMutation.isPending}>
                {page.is_homepage ? "Already homepage" : "Set as homepage"}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                Delete page
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WebsitePageSettingsModal;
