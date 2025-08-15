import { 
  Home, 
  Users, 
  BarChart3, 
  CreditCard, 
  Settings, 
  Store,
  FileText,
  TrendingUp,
  DollarSign,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

const adminMenuItems = [
  {
    title: 'ড্যাশবোর্ড',
    url: '/admin/dashboard',
    icon: Home,
  },
  {
    title: 'ব্যবহারকারী',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'স্টোর সমূহ',
    url: '/admin/stores',
    icon: Store,
  },
  {
    title: 'অ্যানালিটিক্স',
    url: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'বিলিং ও পেমেন্ট',
    url: '/admin/billing',
    icon: CreditCard,
  },
  {
    title: 'প্ল্যান ম্যানেজমেন্ট',
    url: '/admin/plans',
    icon: DollarSign,
  },
];

const quickActions = [
  {
    title: 'রিভিনিউ ট্র্যাকিং',
    url: '/admin/revenue',
    icon: TrendingUp,
  },
  {
    title: 'সাপোর্ট টিকেট',
    url: '/admin/support',
    icon: AlertCircle,
  },
  {
    title: 'সিস্টেম সেটিংস',
    url: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isMainMenuExpanded = adminMenuItems.some((item) => isActive(item.url));
  const isQuickActionsExpanded = quickActions.some((item) => isActive(item.url));

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted/50';

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className={`p-4 ${isCollapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <Settings className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold">অ্যাডমিন প্যানেল</h2>
              <Badge variant="outline" className="text-xs">
                সুপার অ্যাডমিন
              </Badge>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>মূল মেনু</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>দ্রুত অ্যাকশন</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`p-4 ${isCollapsed ? 'px-2' : ''}`}>
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            <p>F-Commerce Builder</p>
            <p>Admin Panel v1.0</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}