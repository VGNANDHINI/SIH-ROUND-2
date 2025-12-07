
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
import { Droplet, LayoutDashboard, Droplets, FileQuestion, Wrench, Home, FileText, Presentation, User, BookMarked, Power, CheckSquare, Megaphone, Users, MessageSquareWarning, FilePenLine, ShieldCheck, FlaskConical, Layers, Map, ClipboardCheck, HeartPulse, MapPin, Camera } from "lucide-react";
import React from "react";

const navItems = {
  "gram-panchayat": [
    { href: "/gram-panchayat", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/gram-panchayat/complaints", label: "View Complaints", icon: <MessageSquareWarning /> },
    { href: "/gram-panchayat/schemes", label: "Water Schemes", icon: <Droplets /> },
    { href: "/gram-panchayat/pump-control", label: "All Pump Status", icon: <Power /> },
    { href: "/gram-panchayat/tank-levels", label: "All Water Tank Levels", icon: <Layers /> },
    { href: "/gram-panchayat/log-book", label: "Log Book", icon: <BookMarked /> },
    { href: "/gram-panchayat/operator-management", label: "Operator Management", icon: <Users /> },
    { href: "/gram-panchayat/alerts", label: "Send Alerts", icon: <Megaphone /> },
    { href: "/gram-panchayat/water-quality", label: "Water Quality", icon: <FlaskConical /> },
    { href: "/gram-panchayat/gis-atlas", label: "GIS Atlas", icon: <Map /> },
    { href: "/gram-panchayat/aerial-view", label: "Aerial View", icon: <Camera /> },
  ],
  "pump-operator": [
    { href: "/pump-operator", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/pump-operator/profile", label: "Operator Profile", icon: <User /> },
    { href: "/pump-operator/checklist", label: "Daily Checklist", icon: <ClipboardCheck /> },
    { href: "/pump-operator/pump-status", label: "Pump Status", icon: <Power /> },
    { href: "/pump-operator/tank-level", label: "Tank Level", icon: <Layers /> },
    { href: "/pump-operator/report", label: "Report Issue", icon: <FileQuestion /> },
    { href: "/pump-operator/maintenance", label: "Maintenance", icon: <Wrench /> },
    { href: "/pump-operator/leakage-diagnostics", label: "Leakage Diagnostics", icon: <HeartPulse /> },
    { href: "/pump-operator/sop-library", label: "SOP Library", icon: <BookMarked /> },
    { href: "/pump-operator/water-quality", label: "Water Quality", icon: <FlaskConical /> },
  ],
  "village-resident": [
    { href: "/village-resident", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/village-resident/availability", label: "Water Availability", icon: <Droplet /> },
    { href: "/village-resident/billing", label: "Pay Bills", icon: <FileText /> },
    { href: "/village-resident/complaints", label: "Register Complaint", icon: <FilePenLine /> },
    { href: "/village-resident/photo-locator", label: "Photo Locator", icon: <MapPin /> },
    { href: "/village-resident/water-quality", label: "Water Quality", icon: <FlaskConical /> },
    { href: "/village-resident/report", label: "Public Report", icon: <Presentation /> },
  ],
  "block-official": [
    { href: "/block-official", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/block-official/approvals", label: "Scheme Approvals", icon: <CheckSquare /> },
    { href: "/block-official/analytics", label: "Analytics", icon: <Presentation /> },
    { href: "/block-official/work-verification", label: "Work Verification", icon: <ShieldCheck /> },
    { href: "/block-official/water-quality", label: "Water Quality", icon: <FlaskConical /> },
  ],
};

type Role = keyof typeof navItems;

export function SidebarNav() {
  const pathname = usePathname();
  const role = pathname.split("/")[1] as Role;
  const currentNavItems = navItems[role] || [];
  
  const getSubPath = (path: string, depth: number) => {
    return "/" + path.split("/").slice(1, depth + 1).join("/");
  }

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
                isActive={getSubPath(pathname, 2) === item.href}
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
