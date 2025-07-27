import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Facebook, Mail, Percent, TrendingUp, Users, Target } from 'lucide-react';

const marketingTools = [
  {
    title: "Facebook Ads",
    description: "Create and manage Facebook advertising campaigns",
    icon: Facebook,
    path: "/dashboard/marketing/facebook",
    status: "Available",
    color: "bg-blue-500",
  },
  {
    title: "Email Campaigns",
    description: "Send newsletters and promotional emails to customers",
    icon: Mail,
    path: "/dashboard/marketing/email",
    status: "Available",
    color: "bg-green-500",
  },
  {
    title: "Discounts & Coupons",
    description: "Create discount codes and promotional offers",
    icon: Percent,
    path: "/dashboard/marketing/discounts",
    status: "Available",
    color: "bg-orange-500",
  },
  {
    title: "SEO Tools",
    description: "Optimize your store for search engines",
    icon: TrendingUp,
    path: "/dashboard/marketing/seo",
    status: "Coming Soon",
    color: "bg-purple-500",
  },
  {
    title: "Customer Segments",
    description: "Create targeted customer groups",
    icon: Users,
    path: "/dashboard/marketing/segments",
    status: "Coming Soon",
    color: "bg-pink-500",
  },
  {
    title: "Retargeting",
    description: "Re-engage visitors who didn't purchase",
    icon: Target,
    path: "/dashboard/marketing/retargeting",
    status: "Coming Soon",
    color: "bg-indigo-500",
  },
];

export default function Marketing() {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Marketing" description="Grow your business with powerful marketing tools">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketingTools.map((tool) => (
            <Card key={tool.title} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${tool.color} text-white`}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{tool.title}</h3>
                      <Badge variant={tool.status === "Available" ? "default" : "secondary"}>
                        {tool.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {tool.description}
                    </p>
                    <Button
                      onClick={() => navigate(tool.path)}
                      disabled={tool.status !== "Available"}
                      className="w-full"
                      size="sm"
                    >
                      {tool.status === "Available" ? "Open" : "Coming Soon"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Campaigns</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Reach</span>
                <span className="font-semibold">12,450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conversion Rate</span>
                <span className="font-semibold">2.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marketing ROI</span>
                <span className="font-semibold text-green-600">+180%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent marketing activity.</p>
                <p className="text-sm">Start a campaign to see activity here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}