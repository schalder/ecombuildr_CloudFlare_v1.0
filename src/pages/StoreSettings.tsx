import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useUserStore } from "@/hooks/useUserStore";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PushNotificationSettings } from '@/components/settings/PushNotificationSettings';
import { PaymentGatewaySettings } from '@/components/settings/PaymentGatewaySettings';
import ShippingIntegrations from '@/components/settings/ShippingIntegrations';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Store name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  is_active: z.boolean().default(true).optional(),
});

export default function StoreSettings() {
  const { store, updateStore } = useUserStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: store?.name || "",
      description: store?.description || "",
      is_active: store?.is_active || true,
    },
  });

  useEffect(() => {
    form.reset({
      name: store?.name || "",
      description: store?.description || "",
      is_active: store?.is_active || true,
    });
  }, [store]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsUpdating(true);
    try {
      if (!store) {
        toast({
          title: "Error",
          description: "Store not found.",
          variant: "destructive",
        });
        return;
      }
      await updateStore(values);
      toast({
        title: "Success",
        description: "Store updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update store. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground">
            Manage your store configuration and preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Store" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief description of your store"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Set store to active or inactive
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Store"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <PushNotificationSettings />
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            {store && <PaymentGatewaySettings storeId={store.id} />}
          </TabsContent>

          <TabsContent value="shipping" className="space-y-4">
            {store && <ShippingIntegrations storeId={store.id} />}
          </TabsContent>

          <TabsContent value="integrations">
            <div>Integrations settings</div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
