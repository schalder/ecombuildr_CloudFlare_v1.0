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
  Store,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Palette
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
  {
    title: "Stores",
    icon: Store,
    items: [
      { title: "My Stores", url: "/dashboard/stores" },
      { title: "Create Store", url: "/dashboard/stores/create" },
    ],
  },
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
    <Sidebar className="border-sidebar-border bg-sidebar">
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
            <div className="space-y-2">
              <Button 
                asChild 
                size="sm" 
                className="w-full justify-start bg-primary hover:bg-primary-glow"
              >
                <NavLink to="/dashboard/products/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </NavLink>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-sidebar-border"
              >
                <NavLink to="/dashboard/websites/create">
                  <FileText className="mr-2 h-4 w-4" />
                  Website Builder
                </NavLink>
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible
                      open={expandedGroups.includes(item.title)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={`w-full justify-between hover:bg-sidebar-accent ${
                            isGroupActive(item.items) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                          }`}
                        >
                          <div className="flex items-center">
                            <item.icon className="mr-3 h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </div>
                          {!collapsed && (
                            expandedGroups.includes(item.title) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton 
                                  asChild
                                  isActive={isActive(subItem.url)}
                                >
                                   <NavLink 
                                     to={subItem.url}
                                     className={() => {
                                       const isActive = location.pathname === subItem.url || 
                                         (subItem.url.includes('?') && location.pathname + location.search === subItem.url);
                                       return isActive 
                                         ? "bg-primary text-primary-foreground hover:bg-primary-glow" 
                                         : "hover:bg-sidebar-accent";
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
                    <SidebarMenuButton asChild isActive={isActive(item.url!)}>
                       <NavLink 
                         to={item.url!}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Store Selector */}
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Store className="h-4 w-4" />
              <span className="truncate">Current Store</span>
            </div>
            <div className="mt-1 text-sm font-medium text-sidebar-foreground truncate">
              My F-Commerce Store
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}