import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, FileText, BarChart3, Megaphone, Settings, Plus, Search, ChevronDown, ChevronRight, Palette, Globe, Shield, Images, BookOpen, PlayCircle, GraduationCap, Sparkles } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
const navigationItems = [{
  title: "Dashboard",
  url: "/dashboard/overview",
  icon: LayoutDashboard
},
// Stores menu removed per requirements
{
  title: "Websites",
  icon: FileText,
  items: [{
    title: "All Websites",
    url: "/dashboard/websites"
  }, {
    title: "Create Website",
    url: "/dashboard/websites/create"
  }]
}, {
  title: "Funnels",
  icon: Palette,
  items: [{
    title: "All Funnels",
    url: "/dashboard/funnels"
  }, {
    title: "Create Funnel",
    url: "/dashboard/funnels/create"
  }]
}, {
  title: "Courses",
  icon: GraduationCap,
  items: [{
    title: "All Courses",
    url: "/dashboard/courses"
  }, {
    title: "Create Course",
    url: "/dashboard/courses/create"
  }, {
    title: "Course Settings",
    url: "/dashboard/courses/settings"
  }, {
    title: "Course Analytics",
    url: "/dashboard/courses/analytics"
  }]
}, {
  title: "Products",
  icon: Package,
  items: [{
    title: "All Products",
    url: "/dashboard/products"
  }, {
    title: "Add Product",
    url: "/dashboard/products/add"
  }, {
    title: "Categories",
    url: "/dashboard/categories"
  }, {
    title: "Collections",
    url: "/dashboard/collections"
  }, {
    title: "Product Library",
    url: "/dashboard/product-library"
  }, {
    title: "Reviews",
    url: "/dashboard/reviews"
  }]
}, {
  title: "Orders",
  icon: ShoppingCart,
  items: [{
    title: "All Orders",
    url: "/dashboard/orders"
  }, {
    title: "Pending",
    url: {
      pathname: "/dashboard/orders",
      search: "?status=pending"
    }
  }, {
    title: "Processing",
    url: {
      pathname: "/dashboard/orders",
      search: "?status=processing"
    }
  }, {
    title: "Shipped",
    url: {
      pathname: "/dashboard/orders",
      search: "?status=shipped"
    }
  }]
}, {
  title: "Customers",
  url: "/dashboard/customers",
  icon: Users
}, {
  title: "Analytics",
  url: "/dashboard/analytics",
  icon: BarChart3
}, {
  title: "Media Storage",
  url: "/dashboard/media",
  icon: Images
}, {
  title: "Domains",
  url: "/dashboard/domains",
  icon: Globe
}, {
  title: "Marketing",
  icon: Megaphone,
  items: [{
    title: "Facebook Ads",
    url: "/dashboard/marketing/facebook"
  }, {
    title: "Email Campaigns",
    url: "/dashboard/marketing/email"
  }, {
    title: "Discounts",
    url: "/dashboard/marketing/discounts"
  }, {
    title: "Content Prompt",
    url: "/dashboard/prompts"
  }]
}, {
  title: "Training",
  url: "/training",
  icon: BookOpen
}, {
  title: "Settings",
  icon: Settings,
  items: [{
    title: "Integrations",
    url: "/dashboard/settings/store"
  }, {
    title: "Profile",
    url: "/dashboard/settings/profile"
  }, {
    title: "Billing",
    url: "/dashboard/settings/billing"
  }]
}];

// Admin navigation items for super admins
const adminNavigationItems = [{
  title: "Prompt Management",
  url: "/admin/prompts",
  icon: FileText
}, {
  title: "Admin Training",
  url: "/admin/training",
  icon: BookOpen
}];

export function AppSidebar() {
  // Safety check for sidebar context
  let sidebarContext;
  try {
    sidebarContext = useSidebar();
  } catch (error) {
    // Fallback if not in sidebar context
    sidebarContext = { open: true };
  }
  
  const { open } = sidebarContext;
  const collapsed = !open;
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const {
          data
        } = await supabase.rpc('is_super_admin');
        setIsSuperAdmin(data || false);
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      }
    };
    checkSuperAdmin();
  }, []);
  const currentPath = location.pathname;
  const isActive = (url: string | {
    pathname: string;
    search: string;
  }) => {
    if (typeof url === 'string') {
      return currentPath === url;
    }
    return currentPath === url.pathname && location.search === url.search;
  };
  const isGroupActive = (items: {
    url: string | {
      pathname: string;
      search: string;
    };
  }[]) => items.some(item => {
    if (typeof item.url === 'string') {
      return currentPath.startsWith(item.url);
    }
    return currentPath.startsWith(item.url.pathname);
  });
  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => prev.includes(title) ? prev.filter(group => group !== title) : [...prev, title]);
  };
  const filteredItems = navigationItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.items && item.items.some(subItem => subItem.title.toLowerCase().includes(searchQuery.toLowerCase())));
  return <Sidebar className="border-sidebar-border bg-sidebar">
      <SidebarContent className="gap-0">
        {/* Logo */}
        {!collapsed && <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-center">
              <img 
                src="https://res.cloudinary.com/funnelsninja/image/upload/v1760696032/ecombuildr-logo-new-v2_ioc4vj.png" 
                alt="EcomBuildr Logo" 
                className="h-10 w-auto"
              />
            </div>
          </div>}

        {/* Quick Actions */}
        {!collapsed && <div className="p-4 border-b border-sidebar-border">
            <div className="space-y-2">
              <Button asChild size="sm" className="w-full justify-start bg-primary hover:bg-primary-glow min-h-[44px] touch-manipulation">
                <NavLink to="/dashboard/products/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </NavLink>
              </Button>
            </div>
          </div>}

        {/* Search */}
        {!collapsed && <div className="p-4 border-b border-sidebar-border">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 bg-sidebar-accent border-sidebar-border min-h-[44px] touch-manipulation" />
            </div>
          </div>}

        {/* Navigation Menu */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filteredItems.map(item => <SidebarMenuItem key={item.title}>
                  {item.items ? <Collapsible open={expandedGroups.includes(item.title)} onOpenChange={() => toggleGroup(item.title)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={`w-full justify-between hover:bg-sidebar-accent min-h-[44px] touch-manipulation ${isGroupActive(item.items) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}>
                          <div className="flex items-center">
                            <item.icon className="mr-3 h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </div>
                          {!collapsed && (expandedGroups.includes(item.title) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map(subItem => <SidebarMenuSubItem key={subItem.title}>
                                 <SidebarMenuSubButton asChild className="min-h-[44px] touch-manipulation">
                                   <NavLink to={subItem.url} end className={({
                          isActive
                        }) => isActive ? "bg-primary text-primary-foreground hover:bg-primary-glow min-h-[44px] touch-manipulation" : "hover:bg-sidebar-accent min-h-[44px] touch-manipulation"}>
                                    {subItem.title}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>)}
                          </SidebarMenuSub>
                        </CollapsibleContent>}
                    </Collapsible> : <SidebarMenuButton asChild className="min-h-[44px] touch-manipulation">
                       <NavLink to={item.url!} end className={({
                  isActive
                }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium min-h-[44px] touch-manipulation" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground min-h-[44px] touch-manipulation"}>
                        <item.icon className="mr-3 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>}
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Training Navigation - only visible for super admins */}
        {isSuperAdmin && currentPath.startsWith('/admin') && <SidebarGroup className="border-t border-sidebar-border">
            <SidebarGroupLabel>Admin Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {adminNavigationItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="min-h-[44px] touch-manipulation">
                      <NavLink to={item.url} className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium min-h-[44px] touch-manipulation" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground min-h-[44px] touch-manipulation"
                      }>
                        <item.icon className="mr-3 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>}

        {/* Super Admin Dashboard Switcher - only visible for super admins */}
        {isSuperAdmin && <SidebarGroup className="border-t border-sidebar-border">
            <SidebarGroupContent className="p-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="min-h-[44px] touch-manipulation">
                    <NavLink to={currentPath.startsWith('/admin') ? '/dashboard/overview' : '/admin/dashboard'} className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 min-h-[44px] touch-manipulation font-medium shadow-md">
                      <Shield className="mr-3 h-4 w-4" />
                      {!collapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

      </SidebarContent>
    </Sidebar>;
}