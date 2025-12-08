
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
import { Droplet, LayoutDashboard, Droplets, FileQuestion, Wrench, Home, FileText, Presentation, User, BookMarked, Power, CheckSquare, Megaphone, Users, MessageSquareWarning, FilePenLine, ShieldCheck, FlaskConical, Layers, Map, ClipboardCheck, HeartPulse, MapPin, Camera, Search, BarChart, Clock, HelpCircle, Sparkles } from "lucide-react";
import React from "react";
import { useTranslation } from "@/hooks/use-translation";

const navItems = {
  "gram-panchayat": [
    { href: "/gram-panchayat", labelKey: "sidebar_gp_dashboard", icon: <LayoutDashboard /> },
    { href: "/gram-panchayat/complaints", labelKey: "sidebar_gp_complaints", icon: <MessageSquareWarning /> },
    { href: "/gram-panchayat/pump-control", labelKey: "sidebar_gp_pump_control", icon: <Power /> },
    { href: "/gram-panchayat/tank-levels", labelKey: "sidebar_gp_tank_levels", icon: <Layers /> },
    { href: "/gram-panchayat/operator-management", labelKey: "sidebar_gp_operator_management", icon: <Users /> },
    { href: "/gram-panchayat/alerts", labelKey: "sidebar_gp_alerts", icon: <Megaphone /> },
    { href: "/gram-panchayat/water-quality", labelKey: "sidebar_gp_water_quality", icon: <FlaskConical /> },
    { href: "/gram-panchayat/gis-atlas", labelKey: "sidebar_gp_gis_atlas", icon: <Map /> },
  ],
  "pump-operator": [
    { href: "/pump-operator", labelKey: "sidebar_po_dashboard", icon: <LayoutDashboard /> },
    { href: "/pump-operator/supply-schedule", labelKey: "sidebar_po_supply_schedule", icon: <Clock /> },
    { href: "/pump-operator/checklist", labelKey: "sidebar_po_checklist", icon: <ClipboardCheck /> },
    { href: "/pump-operator/pump-status", labelKey: "sidebar_po_pump_status", icon: <Power /> },
    { href: "/pump-operator/report", labelKey: "sidebar_po_report_issue", icon: <FileQuestion /> },
    { href: "/pump-operator/maintenance", labelKey: "sidebar_po_maintenance", icon: <Wrench /> },
    { href: "/pump-operator/leakage-detection", labelKey: "sidebar_po_leakage_detection", icon: <Search /> },
    { href: "/pump-operator/sop-library", labelKey: "sidebar_po_sop_library", icon: <BookMarked /> },
    { href: "/pump-operator/water-quality", labelKey: "sidebar_po_water_quality", icon: <FlaskConical /> },
  ],
  "village-resident": [
    { href: "/village-resident", labelKey: "sidebar_vr_dashboard", icon: <LayoutDashboard /> },
    { href: "/village-resident/availability", labelKey: "sidebar_vr_availability", icon: <Droplet /> },
    { href: "/village-resident/complaints", labelKey: "sidebar_vr_complaints", icon: <FilePenLine /> },
    { href: "/village-resident/water-quality", labelKey: "sidebar_vr_water_quality", icon: <FlaskConical /> },
    { href: "/village-resident/report", labelKey: "sidebar_vr_report", icon: <Presentation /> },
    { href: "/village-resident/help", labelKey: "sidebar_vr_help", icon: <HelpCircle /> },
  ],
  "block-official": [
    { href: "/block-official", labelKey: "sidebar_bo_dashboard", icon: <LayoutDashboard /> },
    { href: "/block-official/approvals", labelKey: "sidebar_bo_approvals", icon: <CheckSquare /> },
    { href: "/block-official/analytics", labelKey: "sidebar_bo_analytics", icon: <Presentation /> },
    { href: "/block-official/work-verification", labelKey: "sidebar_bo_work_verification", icon: <ShieldCheck /> },
    { href: "/block-official/water-quality", labelKey: "sidebar_bo_water_quality", icon: <FlaskConical /> },
  ],
};

type Role = keyof typeof navItems;

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
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
          <span className="font-semibold text-lg font-headline">{t('sidebar_jalshakthi')}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={getSubPath(pathname, 2) === item.href}
                tooltip={{ children: t(item.labelKey) }}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{t(item.labelKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={{ children: t('sidebar_user_profile') }} isActive={pathname.endsWith('/profile')}>
                <Link href={`/${role}/profile`}>
                  <User/>
                  <span>{t('sidebar_user_profile')}</span>
                </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
