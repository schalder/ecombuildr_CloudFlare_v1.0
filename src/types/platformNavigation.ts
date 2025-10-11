export interface PlatformNavItem {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  enabled: boolean;
  children: PlatformNavItem[];
}

export interface PlatformNavigationSettings {
  id: string;
  logo_url: string | null;
  nav_items: PlatformNavItem[];
  created_at: string;
  updated_at: string;
}
