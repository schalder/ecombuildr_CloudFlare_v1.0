
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUserStore } from "@/hooks/useUserStore";
import { EmailNotificationSettings } from "@/components/settings/EmailNotificationSettings";
import ShippingIntegrations from "@/components/settings/ShippingIntegrations";
import PaymentSettings from "@/components/settings/PaymentSettings";
import { Mail, CreditCard, Truck } from "lucide-react";

export default function StoreSettings() {
  const { storeId } = useParams();
  const { store, loading, updateStore } = useUserStore();
  const [activeTab, setActiveTab] = useState("payment");

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
            Configure store-level integrations and operational settings for {store.name}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
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
          </TabsList>

          <TabsContent value="notifications">
            <EmailNotificationSettings storeId={store.id} />
          </TabsContent>

          <TabsContent value="payment">
            <PaymentSettings storeId={store.id} />
          </TabsContent>

          <TabsContent value="shipping">
            <ShippingIntegrations storeId={store.id} />
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
}
