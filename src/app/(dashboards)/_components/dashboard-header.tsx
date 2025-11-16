"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const roleTitles: { [key: string]: string } = {
  "gram-panchayat": "Gram Panchayat Dashboard",
  "pump-operator": "Pump Operator Dashboard",
  "village-resident": "Resident Dashboard",
  "block-official": "Block / District Official Dashboard",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const segments = pathname.split('/');
  const role = segments[1];
  
  let title = roleTitles[role] || "Dashboard";
  if(segments[2]) {
    const subPage = segments[2].charAt(0).toUpperCase() + segments[2].slice(1);
    title = `${title.split(' Dashboard')[0]} - ${subPage}`;
  }


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-xl font-semibold font-headline">{title}</h1>
      <div className="ml-auto flex items-center gap-4">
        <Avatar>
          <AvatarFallback>{role.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
