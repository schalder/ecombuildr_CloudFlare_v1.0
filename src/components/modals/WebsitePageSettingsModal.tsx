import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

import { SEOSettingsCard } from "@/components/seo/SEOSettingsCard";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Search } from "lucide-react";

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
  const navigate = useNavigate();
  

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [websiteMeta, setWebsiteMeta] = useState<{ slug?: string; domain?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // SEO hook
  const { seoData, loading: seoLoading, saving: seoSaving, saveSEOData } = usePageSEO(
    page?.id || '', 
    page?.slug || '', 
    'website_page'
  );

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
        .update({ title, slug })
        .eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["website-pages", websiteId] });
      toast({ title: "Page updated successfully" });
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
      toast({ 
        title: "Page deleted",
        description: "The page and all related data have been permanently deleted."
      });
      onClose();
    },
    onError: (err: any) => {
      toast({ 
        title: "Failed to delete page", 
        description: err?.message ?? "This action cannot be undone.", 
        variant: "destructive" 
      });
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

  const handleOpenInBuilder = () => {
    if (!page) return;
    navigate(`/dashboard/websites/${websiteId}/pages/${page.id}/builder`);
    onClose();
  };

  const handleSave = () => updateMutation.mutate();
  const handleSetHomepage = () => setHomepageMutation.mutate();
  const handleDelete = () => {
    setDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setDeleteConfirm(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Page settings</DialogTitle>
          <DialogDescription>Update page details, publish status, and actions.</DialogDescription>
        </DialogHeader>

        {page && (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="seo">
                <Search className="w-4 h-4 mr-2" />
                SEO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-5">
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
                  <Label className="block">Publication Status</Label>
                  <p className="text-sm text-muted-foreground">Use the page builder to publish changes.</p>
                </div>
                <Badge variant={page.is_published ? "default" : "secondary"}>
                  {page.is_published ? "Published" : "Not Published"}
                </Badge>
              </div>

              <div className="grid gap-2">
                <Label>Page Builder</Label>
                <Button variant="outline" onClick={handleOpenInBuilder} className="justify-start">
                  Open in Page Builder
                </Button>
                <p className="text-sm text-muted-foreground">Use "Save & Publish" in the builder to publish your changes.</p>
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
                <Button 
                  variant="destructive" 
                  onClick={handleDelete} 
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete page"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              {seoLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <SEOSettingsCard
                  data={seoData || {}}
                  onChange={(data) => saveSEOData(data)}
                  pageUrl={url}
                />
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || seoSaving}>
            {updateMutation.isPending || seoSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmationDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Delete Page"
        description={`Are you sure you want to delete "${page?.title}"? This action cannot be undone and will permanently delete all associated data.`}
        confirmText="Delete Page"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </Dialog>
  );
};

export default WebsitePageSettingsModal;
