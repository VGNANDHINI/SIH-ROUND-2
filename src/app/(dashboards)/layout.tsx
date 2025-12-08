
"use client";

import { useUser } from "@/firebase/auth/use-user";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "./_components/sidebar-nav";
import { DashboardHeader } from "./_components/dashboard-header";
import { Loader2 } from "lucide-react";
import { LanguageProvider } from "@/context/language-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirectTo = `/login?redirectTo=${pathname}`;
      router.push(redirectTo);
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <LanguageProvider>
      <SidebarProvider>
        <SidebarNav />
        <SidebarInset>
          <DashboardHeader />
          <main className="p-4 lg:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </LanguageProvider>
  );
}
