import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Package, X, Wallet } from "lucide-react";

interface OperationalCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

function OperationalCard({ title, value, icon: Icon, loading }: OperationalCardProps) {
  if (loading) {
    return (
      <Card className="bg-gradient-card border-border shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

interface OperationalStats {
  pendingOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
  courierBalance: number;
}

interface OperationalCardsProps {
  stats?: OperationalStats;
  loading?: boolean;
}

export function OperationalCards({ stats, loading = false }: OperationalCardsProps) {
  const defaultStats = {
    pendingOrders: 0,
    shippedOrders: 0,
    cancelledOrders: 0,
    courierBalance: 0,
  };

  const data = stats || defaultStats;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
      <OperationalCard
        title="Pending Orders"
        value={data.pendingOrders.toLocaleString()}
        icon={Clock}
        loading={loading}
      />
      <OperationalCard
        title="Shipped Orders"
        value={data.shippedOrders.toLocaleString()}
        icon={Package}
        loading={loading}
      />
      <OperationalCard
        title="Cancelled Orders"
        value={data.cancelledOrders.toLocaleString()}
        icon={X}
        loading={loading}
      />
      <OperationalCard
        title="Courier Balance"
        value={`৳${data.courierBalance.toLocaleString()}`}
        icon={Wallet}
        loading={loading}
      />
    </div>
  );
}