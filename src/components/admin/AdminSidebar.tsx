import React from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Home, BarChart3, DollarSign, Globe, Package, ShoppingCart, Users, CreditCard, Settings, HelpCircle, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<any>;
  items?: NavItem[];
}

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navigationItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/admin/dashboard",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      href: "/admin/analytics",
    },
    {
      title: "Revenue",
      icon: DollarSign,
      href: "/admin/revenue",
    },
    {
      title: "Sites",
      icon: Globe,
      href: "/admin/sites",
    },
    {
      title: "Product Library",
      icon: Package,
      items: [
        {
          title: "All Products",
          href: "/admin/product-library",
        },
        {
          title: "Categories",
          href: "/admin/product-library/categories",
        },
        {
          title: "Add Product",
          href: "/admin/product-library/add",
        }
      ]
    },
    {
      title: "Orders",
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      title: "Users",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "Plans & Billing",
      icon: CreditCard,
      items: [
        {
          title: "Plans",
          href: "/admin/plans",
        },
        {
          title: "Billing",
          href: "/admin/billing",
        },
        {
          title: "Site Pricing",
          href: "/admin/pricing",
        }
      ]
    },
    {
      title: "Settings",
      icon: Settings,
      items: [
        {
          title: "SEO",
          href: "/admin/seo",
        },
        {
          title: "System",
          href: "/admin/system",
        }
      ]
    },
    {
      title: "Support",
      icon: HelpCircle,
      href: "/admin/support",
    },
  ];

  return (
    <div className="w-64 flex-shrink-0 border-r bg-secondary">
      <div className="flex h-16 items-center px-4">
        <Link to="/" className="font-semibold">
          Admin Panel
        </Link>
      </div>
      <nav className="flex flex-col space-y-1 p-4">
        {navigationItems.map((item) => (
          item.href ? (
            <Link
              key={item.title}
              to={item.href}
              className={cn(
                "group flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                currentPath === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              <span>{item.title}</span>
            </Link>
          ) : (
            <Accordion key={item.title} item={item} currentPath={currentPath} />
          )
        ))}
      </nav>
    </div>
  );
}

interface AccordionProps {
  item: NavItem;
  currentPath: string;
}

function Accordion({ item, currentPath }: AccordionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (item.items?.some(subItem => currentPath === subItem.href)) {
      setIsOpen(true);
    }
  }, [currentPath, item.items]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex w-full items-center justify-between space-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          isOpen ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        )}
      >
        <div className="flex items-center space-x-2">
          {item.icon && <item.icon className="h-4 w-4" />}
          <span>{item.title}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      {isOpen && item.items && (
        <div className="pl-4 space-y-1">
          {item.items.map((subItem) => (
            <Link
              key={subItem.title}
              to={subItem.href || ""}
              className={cn(
                "group flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                currentPath === subItem.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <span>{subItem.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
