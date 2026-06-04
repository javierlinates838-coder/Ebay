import { AppSidebar, AppHeader } from "@/components/layout/app-nav";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </div>
    </TooltipProvider>
  );
}

export { AppHeader };
