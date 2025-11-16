import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "./_components/sidebar-nav";
import { DashboardHeader } from "./_components/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <DashboardHeader />
        <main className="p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
