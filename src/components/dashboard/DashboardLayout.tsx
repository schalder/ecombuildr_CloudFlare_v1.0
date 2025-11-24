import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { useDashboardTheme } from "@/hooks/useDashboardTheme";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const pageTitle = title ? `${title} | EcomBuildr` : "Dashboard | EcomBuildr";
  const { dashboardThemeClass } = useDashboardTheme();
  
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <SidebarProvider defaultOpen={true}>
      <div className={`min-h-screen flex w-full bg-background ${dashboardThemeClass}`}>
        <AppSidebar />
        <SidebarInset className="flex-1">
          <DashboardHeader title={title} description={description} />
          <main className="flex-1 overflow-auto overflow-x-hidden">
            <div className="container mx-auto px-4 py-6 md:p-6 space-y-6 w-full max-w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
        <WhatsAppWidget />
      </div>
    </SidebarProvider>
    </>
  );
}