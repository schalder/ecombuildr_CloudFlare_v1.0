import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const generalSettingsSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  slug: z.string().min(1, "Store slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  is_active: z.boolean(),
});

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>;

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  is_active: boolean;
}

interface GeneralSettingsProps {
  store: Store;
  onUpdate: (data: Partial<Store>) => Promise<any>;
}

export function GeneralSettings({ store, onUpdate }: GeneralSettingsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const form = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      name: store.name,
      slug: store.slug,
      description: store.description || "",
      logo_url: store.logo_url || "",
      favicon_url: store.favicon_url || "",
      primary_color: store.primary_color || "",
      secondary_color: store.secondary_color || "",
      is_active: store.is_active,
    },
  });

  const checkSlugAvailability = async (slug: string, currentSlug: string) => {
    if (slug === currentSlug) {
      setSlugError(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .neq("id", store.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking slug:", error);
        return;
      }

      if (data) {
        setSlugError("This slug is already taken");
      } else {
        setSlugError(null);
      }
    } catch (error) {
      console.error("Error checking slug:", error);
    } finally {
      setCheckingSlug(false);
    }
  };

  const onSubmit = async (data: GeneralSettingsForm) => {
    if (slugError) {
      toast({
        title: "Error",
        description: "Please fix the slug error before saving",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(data);
      toast({
        title: "Success",
        description: "Store settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating store:", error);
      toast({
        title: "Error",
        description: "Failed to update store settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Basic store information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter store name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="store-slug"
                        {...field}
                        onBlur={(e) => {
                          field.onBlur();
                          checkSlugAvailability(e.target.value, store.slug);
                        }}
                      />
                    </FormControl>
                    {checkingSlug && (
                      <p className="text-sm text-muted-foreground">Checking availability...</p>
                    )}
                    {slugError && (
                      <p className="text-sm text-destructive">{slugError}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of your store"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Logo</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        label="Upload logo"
                        accept="image/*"
                        maxSize={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="favicon_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        label="Upload favicon"
                        accept="image/x-icon,image/png,image/jpg,image/jpeg"
                        maxSize={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        color={field.value || "#000000"}
                        onChange={field.onChange}
                        label="Primary Color"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        color={field.value || "#000000"}
                        onChange={field.onChange}
                        label="Secondary Color"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Store Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable or disable your store
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading || checkingSlug || !!slugError}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}