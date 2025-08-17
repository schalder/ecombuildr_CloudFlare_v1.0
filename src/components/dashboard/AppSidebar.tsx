import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  BarChart3, 
  Megaphone,
  Settings,
  
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Palette,
  Globe
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  // Stores menu removed per requirements
  {
    title: "Websites",
    icon: FileText,
    items: [
      { title: "All Websites", url: "/dashboard/websites" },
      { title: "Create Website", url: "/dashboard/websites/create" },
    ],
  },
  {
    title: "Funnels",
    icon: Palette,
    items: [
      { title: "All Funnels", url: "/dashboard/funnels" },
      { title: "Create Funnel", url: "/dashboard/funnels/create" },
    ],
  },
  {
    title: "Products",
    icon: Package,
      items: [
        { title: "All Products", url: "/dashboard/products" },
        { title: "Add Product", url: "/dashboard/products/add" },
        { title: "Categories", url: "/dashboard/categories" },
        { title: "Product Library", url: "/dashboard/product-library" },
        { title: "Reviews", url: "/dashboard/reviews" },
      ],
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    items: [
      { title: "All Orders", url: "/dashboard/orders" },
      { title: "Pending", url: "/dashboard/orders?status=pending" },
      { title: "Processing", url: "/dashboard/orders?status=processing" },
      { title: "Shipped", url: "/dashboard/orders?status=shipped" },
    ],
  },
  {
    title: "Customers",
    url: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Domains",
    url: "/dashboard/domains",
    icon: Globe,
  },
  {
    title: "Marketing",
    icon: Megaphone,
    items: [
      { title: "Facebook Ads", url: "/dashboard/marketing/facebook" },
      { title: "Email Campaigns", url: "/dashboard/marketing/email" },
      { title: "Discounts", url: "/dashboard/marketing/discounts" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      { title: "Store Settings", url: "/dashboard/settings/store" },
      { title: "Profile", url: "/dashboard/settings/profile" },
      { title: "Billing", url: "/dashboard/settings/billing" },
    ],
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const collapsed = !open;
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Websites", "Funnels"]);

  const currentPath = location.pathname;

  const isActive = (url: string) => currentPath === url;
  const isGroupActive = (items: { url: string }[]) => 
    items.some(item => currentPath.startsWith(item.url));

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) 
        ? prev.filter(group => group !== title)
        : [...prev, title]
    );
  };

  const filteredItems = navigationItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.items && item.items.some(subItem => 
      subItem.title.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  return (
    <Sidebar className="border-sidebar-border bg-sidebar touch-pan-y"
      style={{ 
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      <SidebarContent className="gap-0">
        {/* Search */}
        {!collapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-sidebar-accent border-sidebar-border"
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!collapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="space-y-3">
              <Button 
                asChild 
                size="default" 
                className="w-full justify-start bg-primary hover:bg-primary-glow active:bg-primary-glow touch-manipulation min-h-[44px] text-base"
              >
                <NavLink to="/dashboard/products/add">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Product
                </NavLink>
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible
                      open={expandedGroups.includes(item.title)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={`w-full justify-between hover:bg-sidebar-accent active:bg-sidebar-accent touch-manipulation min-h-[44px] text-base px-3 py-2 ${
                            isGroupActive(item.items) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                          }`}
                        >
                          <div className="flex items-center">
                            <item.icon className="mr-3 h-5 w-5" />
                            {!collapsed && <span className="text-base">{item.title}</span>}
                          </div>
                          {!collapsed && (
                            expandedGroups.includes(item.title) ? 
                            <ChevronDown className="h-5 w-5" /> : 
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title} className="my-1">
                                <SidebarMenuSubButton 
                                  asChild
                                  isActive={isActive(subItem.url)}
                                  className="min-h-[40px] touch-manipulation"
                                >
                                   <NavLink 
                                     to={subItem.url}
                                     className={() => {
                                       const isActive = location.pathname === subItem.url || 
                                         (subItem.url.includes('?') && location.pathname + location.search === subItem.url);
                                       return `touch-manipulation px-4 py-2 text-base min-h-[40px] flex items-center ${isActive 
                                         ? "bg-primary text-primary-foreground hover:bg-primary-glow active:bg-primary-glow" 
                                         : "hover:bg-sidebar-accent active:bg-sidebar-accent"}`;
                                     }}
                                  >
                                    {subItem.title}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild isActive={isActive(item.url!)} className="min-h-[44px] touch-manipulation text-base px-3 py-2">
                       <NavLink 
                         to={item.url!}
                         className="touch-manipulation hover:bg-sidebar-accent active:bg-sidebar-accent flex items-center w-full"
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {!collapsed && <span className="text-base">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}