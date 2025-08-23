
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStore } from "@/hooks/useUserStore";
import { EmailNotificationSettings } from "@/components/settings/EmailNotificationSettings";
import ShippingIntegrations from "@/components/settings/ShippingIntegrations";
import PaymentSettings from "@/components/settings/PaymentSettings";
import { Settings, Mail, CreditCard, Truck, Globe } from "lucide-react";

export default function StoreSettings() {
  const { storeId } = useParams();
  const { store, loading } = useUserStore();
  const [activeTab, setActiveTab] = useState("general");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!store) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Store not found</h2>
          <p className="text-gray-600 mt-2">The store you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground">
            Configure your store settings and preferences for {store.name}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipping
            </TabsTrigger>
            <TabsTrigger value="domains" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domains
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic store information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">General settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <EmailNotificationSettings storeId={storeId!} />
          </TabsContent>

          <TabsContent value="payment">
            <PaymentSettings storeId={store.id} />
          </TabsContent>

          <TabsContent value="shipping">
            <ShippingIntegrations storeId={store.id} />
          </TabsContent>

          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <CardTitle>Domain Settings</CardTitle>
                <CardDescription>
                  Manage custom domains for your store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Domain settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
