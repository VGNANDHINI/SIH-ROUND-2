"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Droplet, LayoutDashboard, Droplets, FileQuestion, Wrench, Home, FileText, Presentation, User, BookMarked } from "lucide-react";
import React from "react";

const navItems = {
  "gram-panchayat": [
    { href: "/gram-panchayat", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/gram-panchayat/schemes", label: "Water Schemes", icon: <Droplets /> },
    { href: "/gram-panchayat/log-book", label: "Log Book", icon: <BookMarked /> },
  ],
  "pump-operator": [
    { href: "/pump-operator", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/pump-operator/report", label: "Report Issue", icon: <FileQuestion /> },
    { href: "/pump-operator/maintenance", label: "Maintenance", icon: <Wrench /> },
  ],
  "village-resident": [
    { href: "/village-resident", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/village-resident/availability", label: "Water Availability", icon: <Droplet /> },
    { href: "/village-resident/billing", label: "Pay Bills", icon: <FileText /> },
  ],
  "block-official": [
    { href: "/block-official", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/block-official/analytics", label: "Analytics", icon: <Presentation /> },
  ],
};

type Role = keyof typeof navItems;

export function SidebarNav() {
  const pathname = usePathname();
  const role = pathname.split("/")[1] as Role;
  const currentNavItems = navItems[role] || [];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Droplet className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg font-headline">JalSaathi</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={{ children: "Profile" }}>
                <Link href="#">
                  <User/>
                  <span>User Profile</span>
                </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
